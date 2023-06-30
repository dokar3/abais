import CircularLoader from "@/components/CircularLoader";
import Layout from "@/components/Layout";
import PromptBar from "@/components/PromptBar";
import StoryPaper, { GeneratedImage } from "@/components/StoryPaper";
import { StorySubmitArgs, useStory } from "@/data/fetcher/streamStoryFetcher";
import { MuiStyles } from "@/styles/MuiStyles";
import { Model } from "@/data/models";
import { UserPrompts } from "@/utils/prompts";
import { Story } from "@/data/story";
import { ShareIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@mui/material";
import { useRouter } from "next/router";
import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { NextPageWithLayout } from "../_app";
import { Routes } from "@/utils/Routes";
import { StoryParser } from "@/utils/storyParser";
import { GetServerSideProps } from "next";
import { HeaderUtil } from "@/utils/headers";
import { AppContext } from "../../lib/AppContext";
import prisma from "@/lib/prisma";
import { generateIdFromNumber } from "@/utils/userIdGenerator";
import ShareStoryDialog from "@/components/ShareStoryDialog";
import React from "react";

type HomeProps = {
  username: string;
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  req,
}) => {
  const ip = HeaderUtil.getIpAddressNextRequest(req);
  const visitor = await prisma.visitor.findFirst({
    where: { ip: ip ?? "" },
  });

  const now = Date.now();

  let name: string;
  if (visitor == null) {
    const count = await prisma.visitor.count();
    const res = await prisma.visitor.create({
      data: {
        ip: ip ?? "",
        name: generateIdFromNumber(count),
        createdAt: now,
        lastVisited: now,
      },
    });
    name = res.name;
  } else {
    await prisma.visitor.updateMany({
      where: { ip: ip ?? "" },
      data: { lastVisited: now },
    });
    name = visitor.name;
  }

  return {
    props: {
      username: name,
    },
  };
};

const Page: NextPageWithLayout<HomeProps> = (props) => {
  const { updater } = useContext(AppContext);

  useEffect(() => {
    globalThis.localStorage?.setItem("username", props.username);
    updater.updateUsername(props.username);
  }, [props.username, updater]);

  return <WriteStoryPage />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

function WriteStoryPage() {
  const router = useRouter();

  const [hint, setHint] = useState("");

  const [prompt, setPrompt] = useState("");

  const [textModel, setTextModel] = useState(Model.Text.GPT_35_Turbo);

  const [imageModel, setImageModel] = useState(Model.Image.StableDiffusion_2_1);

  const [storySubmitArgs, setStorySubmitArgs] =
    useState<StorySubmitArgs | null>(null);

  const story = useStory(storySubmitArgs);

  const [storyUrl, setStoryUrl] = useState<string | null>(null);

  const [isStoryShared, setStoryShared] = useState(false);

  const [hasGeneratingImages, setHasGeneratingImages] = useState(false);

  const [generatedImages, setGeneratedImages] = useState(
    new Map<string, GeneratedImage>()
  );

  const [isShowShareDialog, setShowShareDialog] = useState(false);

  const shareEnabled =
    story != null &&
    story.content != null &&
    story.contentElements != null &&
    story.isGenerating === false &&
    !hasGeneratingImages;

  const updateGeneratedImage = useCallback((image: GeneratedImage) => {
    setGeneratedImages((prev) => {
      const newMap = new Map(prev);
      newMap.set(image.prompt, image);
      return newMap;
    });
  }, []);

  const submit = useCallback(() => {
    const hintAsPrompt = prompt.length === 0;
    const promptToSubmit = hintAsPrompt ? hint : prompt;

    if (hintAsPrompt) {
      setPrompt(hint);
    }

    setStorySubmitArgs({
      textModel: textModel,
      imageModel: imageModel,
      prompt: promptToSubmit,
    });

    setStoryUrl(null);
    setStoryShared(false);
    setGeneratedImages(new Map());
  }, [hint, prompt, textModel, imageModel]);

  useEffect(() => {
    const index = Math.floor(Math.random() * UserPrompts.length);
    setHint(UserPrompts[index]);
  }, []);

  useEffect(() => {
    if (router.pathname === "/") {
      router.replace(Routes.WRITE);
    }
  }, [router, router.pathname]);

  return (
    <div className="w-full flex justify-center my-4">
      <div className="w-full max-w-4xl px-4">
        <div className="mb-8 flex justify-center">
          <span className="bg-violet-500 py-2 px-4 font-mono text-4xl font-bold text-white">
            Generate?!
          </span>
        </div>

        <PromptBar
          className="mb-4"
          hint={hint}
          content={prompt}
          submitDisabled={story?.isGenerating === true}
          textModel={textModel}
          imageModel={imageModel}
          onUpdateContent={setPrompt}
          onUpdateTextModel={setTextModel}
          onUpdateImageModel={setImageModel}
          onSubmit={submit}
        />

        <div className="my-8">
          <div className="mb-4 flex justify-end">
            <button
              className={
                "px-2 py-1 " +
                (shareEnabled
                  ? "text-white bg-violet-500 hover:bg-violet-600 cursor-pointer"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400")
              }
              onClick={() => {
                if (shareEnabled) {
                  setShowShareDialog(true);
                }
              }}
              disabled={!shareEnabled}
            >
              <div className="flex items-center">
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </div>
            </button>
          </div>

          <StoryPaper
            imageModel={imageModel}
            story={story}
            isFrozen={false}
            onRegenerateClick={submit}
            onUpdateGeneratedImage={updateGeneratedImage}
            onUpdateHasGeneratingImages={setHasGeneratingImages}
          />
        </div>
      </div>

      {story != null && (
        <ShareStoryDialog
          open={isShowShareDialog}
          story={story}
          storyUrl={storyUrl}
          isStoryShared={isStoryShared}
          generatedImages={generatedImages}
          onClose={() => setShowShareDialog(false)}
          onStoryShared={(url) => {
            setStoryShared(true);
            setStoryUrl(url);
          }}
        />
      )}
    </div>
  );
}
