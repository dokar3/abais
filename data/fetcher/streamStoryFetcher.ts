import { Model } from "@/data/models";
import { Story } from "@/data/story";
import { StoryParser } from "@/utils/storyParser";
import { useEffect, useState } from "react";
import useSWR, { Fetcher, KeyedMutator, mutate as globalMutate } from "swr";
import { FetchResponse } from "./fetchResponse";
import { FetchResult } from "./fetchResult";

export type StorySubmitArgs = {
  textModel: Model;
  imageModel: Model;
  prompt: string;
};

export const useStory = (args: StorySubmitArgs | null): Story | null => {
  const [story, setStory] = useState<Story | null>(null);

  const { data, error, isLoading, mutate } = useStreamStory(
    args != null ? { model: args.textModel.apiName, prompt: args.prompt } : null
  );

  useEffect(() => {
    if (args == null) {
      return;
    }
    const story: Story = {
      prompt: args.prompt,
      textModel: args.textModel,
      imageModel: args.imageModel,
      isGenerating: true,
      content: null,
      contentElements: null,
      error: null,
    };
    setStory(story);
    // Force request
    mutate();
  }, [args]);

  useEffect(() => {
    setStory((prev) => {
      if (prev == null) {
        return null;
      }
      return {
        ...prev,
        content: data ?? null,
        contentElements: data != null ? StoryParser.parse(data) : null,
        error: error ?? null,
        isGenerating: isLoading,
      };
    });
  }, [data, error, isLoading]);

  return story;
};

type FetchStreamStoryArgs = {
  model: string;
  prompt: string;
};

type UseStreamStoryResult = FetchResponse<string> & {
  mutate: KeyedMutator<FetchResult<string>>;
};

const useStreamStory = (
  args: FetchStreamStoryArgs | null
): UseStreamStoryResult => {
  const { data, error, isLoading, mutate } = useSWR(args, fetcher, {
    revalidateOnMount: false,
    revalidateOnReconnect: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  if (error != null) {
    return {
      mutate: mutate,
      error: error.toString(),
      isLoading: isLoading,
    };
  } else if (data != null) {
    if (data.ok === true) {
      return {
        mutate: mutate,
        data: data.data,
        isLoading: isLoading,
      };
    } else {
      return {
        mutate: mutate,
        error: data.message,
        isLoading: isLoading,
      };
    }
  } else {
    return {
      mutate: mutate,
      isLoading: isLoading,
    };
  }
};

const fetcher: Fetcher<FetchResult<string>, FetchStreamStoryArgs> = (args) => {
  function updateData(data: FetchResult<string>) {
    globalMutate(args, data, {
      optimisticData: data,
      revalidate: false,
      populateCache: false,
    });
  }

  // Reset data on start
  updateData({ ok: false });

  return fetch("/api/story/write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      model: args.model,
    }),
  }).then(async (res) => {
    if (res.status !== 200) {
      return { ok: false, message: (await res.text()) ?? "Unknown error." };
    }

    const reader = res.body?.getReader();
    if (reader == null) {
      return { ok: false, message: "No data received." };
    }

    const textDecoder = new TextDecoder();

    let message = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = textDecoder.decode(value);

      // Check error
      if (
        text.length !== 0 &&
        text[0] === "{" &&
        text[text.length - 1] === "}" &&
        message.length === 0
      ) {
        const resp = JSON.parse(text);
        if (resp.message != null) {
          updateData({
            ok: false,
            message: resp.message ?? resp,
          });
          // Maybe it's not an error but included in the bot response
          message += text;
          continue;
        }
      }

      message += text;

      updateData({
        ok: true,
        data: message,
      });
    }

    return { ok: true, data: message };
  });
};
