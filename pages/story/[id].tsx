import Layout from "@/components/Layout";
import StoryPaper from "@/components/StoryPaper";
import prisma from "@/lib/prisma";
import { Model } from "@/data/models";
import { Story as UiStory } from "@/data/story";
import { StoryParser } from "@/utils/storyParser";
import { Story } from "@prisma/client";
import { GetServerSideProps } from "next";
import React, { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";

export const getServerSideProps: GetServerSideProps<{
  story: Story | null;
}> = async ({ params }) => {
  try {
    const story = await prisma.story.findUnique({
      where: {
        id: String(params?.id),
      },
    });
    return {
      props: { story: story },
    };
  } catch (e) {
    return {
      props: { story: null },
    };
  }
};

const Page: NextPageWithLayout<{ story: Story | null }> = (props) => {
  if (props.story == null) {
    return (
      <p className="p-4 text-center text-xl text-gray-900 dark:text-white">
        Story not found.
      </p>
    );
  } else {
    return <StoryPage story={props.story} />;
  }
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

function StoryPage({ story }: { story: Story | undefined }) {
  const uiStory: UiStory | null = React.useMemo(() => {
    if (story == null) {
      return null;
    }
    const unknownModel: Model = {
      apiName: "_unknown",
      humanName: "???",
      available: false,
    };
    return {
      content: story.content,
      contentElements: StoryParser.parse(story.content),
      textModel: Model.Text.findByApiName(story.textModel) ?? unknownModel,
      imageModel: Model.Image.findByApiName(story.imageModel) ?? unknownModel,
      prompt: story.prompt,
      isGenerating: false,
      error: null,
    };
  }, [story]);

  if (uiStory == null) {
    return (
      <div className="w-full h-full p-4 flex justify-center items-center">
        Story not found?!
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-4xl p-4 mb-8">
        <StoryPaper
          imageModel={uiStory.imageModel}
          story={uiStory}
          isFrozen={true}
          onRegenerateClick={() => {}}
          onUpdateGeneratedImage={() => {}}
          onUpdateHasGeneratingImages={() => {}}
        />
      </div>
    </div>
  );
}
