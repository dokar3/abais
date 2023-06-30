"use client";

import { Story, StoryElement } from "@/data/story";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import CircularLoader from "./CircularLoader";

import { Model } from "@/data/models";
import { ClickAwayListener, Tooltip } from "@mui/material";
import "react-loading-skeleton/dist/skeleton.css";

type GenerativeImage = {
  prompt: string;
  error: string | null;
  url: string | null;
  isWaiting: boolean;
  isGenerating: boolean;
};

export type GeneratedImage = {
  prompt: string;
  url: string;
};

const PAPER_FOREGROUND_CLASS =
  "z-20 relative bg-white dark:bg-gray-900 p-6 border-2 border-gray-500 dark:border-gray-600";

const PAPER_BACKGROUND_CLASS =
  "z-10 absolute w-full h-full bg-violet-500/50 translate-x-2 translate-y-2";

export default function StoryPaper({
  className,
  imageModel,
  story,
  isFrozen,
  onRegenerateClick,
  onUpdateGeneratedImage,
  onUpdateHasGeneratingImages,
}: {
  className?: string;
  imageModel: Model;
  story: Story | null;
  isFrozen: boolean;
  onRegenerateClick: () => void;
  onUpdateGeneratedImage: (image: GeneratedImage) => void;
  onUpdateHasGeneratingImages: (value: boolean) => void;
}) {
  const [skeletonHeight, setSkeletonHeight] = useState(0);

  const skeletonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const skeleton = skeletonRef.current;
    if (skeleton == null) {
      return;
    }
    const updateSkeletonHeight = () => {
      setSkeletonHeight((prev) => {
        return Math.max(prev, skeleton.offsetHeight);
      });
    };
    const resizeObserver = new ResizeObserver(updateSkeletonHeight);
    resizeObserver.observe(skeleton);
    updateSkeletonHeight();
    return () => {
      resizeObserver.unobserve(skeleton);
    };
  }, [skeletonRef]);

  if (story == null) {
    return (
      <StorySkeleton
        isAnimating={false}
        ref={skeletonRef}
        error={null}
        onRetryClick={onRegenerateClick}
      />
    );
  } else if (
    story != null &&
    (story.contentElements == null || story.contentElements.length === 0)
  ) {
    return (
      <StorySkeleton
        isAnimating={story.isGenerating}
        ref={skeletonRef}
        error={story.error}
        onRetryClick={onRegenerateClick}
      />
    );
  } else {
    return (
      <StoryContent
        className={className}
        minContentHeight={skeletonHeight}
        imageModel={imageModel}
        story={story}
        isFrozen={isFrozen}
        onUpdateGeneratedImage={onUpdateGeneratedImage}
        onUpdateHasGeneratingImages={onUpdateHasGeneratingImages}
      />
    );
  }
}

type StorySkeletonProps = {
  isAnimating: boolean;
  error: string | null;
  onRetryClick: () => void;
};

const StorySkeleton = React.forwardRef<HTMLDivElement, StorySkeletonProps>(
  (props, ref) => {
    return (
      <div className="w-full relative" ref={ref}>
        <div className={PAPER_BACKGROUND_CLASS}></div>
        <div className={PAPER_FOREGROUND_CLASS}>
          {props.error != null && (
            <div className="mb-4 flex justify-between items-center">
              <p className="mr-4 text-red-500 line-clamp-2 overflow-hidden">
                {props.error.substring(0, 200)}
              </p>
              <button
                className="shrink-0 px-2 py-1 text-white cursor-pointer bg-violet-500 hover:bg-violet-600"
                onClick={props.onRetryClick}
              >
                Retry
              </button>
            </div>
          )}

          <Skeleton
            className="mb-6 dark:opacity-20"
            height={36}
            borderRadius={0}
            enableAnimation={props.isAnimating}
          />
          <Skeleton
            className="mb-2 dark:opacity-20"
            borderRadius={0}
            enableAnimation={props.isAnimating}
            count={4}
          />
          <Skeleton
            className="mt-6 dark:opacity-20"
            height={360}
            borderRadius={0}
            enableAnimation={props.isAnimating}
          />
        </div>
      </div>
    );
  }
);

function StoryContent({
  className,
  minContentHeight,
  imageModel,
  story,
  isFrozen,
  onUpdateGeneratedImage,
  onUpdateHasGeneratingImages,
}: {
  className?: string;
  minContentHeight?: number;
  imageModel: Model;
  story: Story;
  isFrozen: boolean;
  onUpdateGeneratedImage: (image: GeneratedImage) => void;
  onUpdateHasGeneratingImages: (value: boolean) => void;
}) {
  const elements = React.useMemo(
    () => story.contentElements ?? [],
    [story.contentElements]
  );

  const imageElements = React.useMemo(() => {
    return elements.filter((item) => item instanceof Story.Image);
  }, [elements]);

  const [storyImages, setStoryImages] = useState<Map<string, GenerativeImage>>(
    () => new Map()
  );

  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);

  const generateImages = useCallback(
    (prompts: string[]) => {
      if (prompts.length === 0) {
        return;
      }

      function updateImages(
        targetPrompts: string[],
        update: (prevImage: GenerativeImage) => GenerativeImage
      ) {
        setStoryImages((prev) => {
          let newMap = new Map(prev);

          for (const prompt of targetPrompts) {
            const image = newMap.get(prompt);
            if (image == null) {
              continue;
            }
            const updated = update(image);
            newMap = new Map(newMap.set(prompt, updated));
          }

          return newMap;
        });
      }

      updateImages(prompts, (prev) => {
        return {
          ...prev,
          error: null,
          isWaiting: false,
          isGenerating: true,
        };
      });

      fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ model: imageModel.apiName, prompts: prompts }),
      })
        .then((res) => {
          if (res.status !== 200) {
            throw new Error("Failed to generated with status: " + res.status);
          }
          return res;
        })
        .then(async (res) => {
          const reader = res.body?.getReader();
          if (reader == null) {
            return;
          }
          const textDecoder = new TextDecoder();

          let prevTrunk: string = "";

          function handleImageResult(json: string) {
            let data: any;
            try {
              data = JSON.parse(json);
            } catch (e) {
              console.error(e);
              console.error("JSON:", json);
              data = {
                ok: false,
                message: "Unexpected data.",
              };
            }
            const prompt = data.prompt;
            const toUpdate: string[] = prompt != null ? [prompt] : prompts;
            const url = data.url;

            if (url != null) {
              onUpdateGeneratedImage({ prompt: prompt, url: url });
            }

            updateImages(toUpdate, (prev) => {
              return {
                ...prev,
                error: data.ok === true ? null : data.message,
                url: data.url,
                isWaiting: false,
                isGenerating: false,
              };
            });
          }

          function likelyValidJson(text: string): boolean {
            return (
              text != null &&
              text.length >= 2 &&
              text[0] === "{" &&
              text[text.length - 1] === "}"
            );
          }

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            // Decode string, is this good idea to use trim()?
            const trunk = textDecoder.decode(value).trim();

            // Check error
            if (!trunk.startsWith("data: ") && likelyValidJson(trunk)) {
              const resp = JSON.parse(trunk);
              const prompt = resp.prompt;
              if (typeof prompt === "string") {
                updateImages([prompt], (prev) => {
                  return { ...prev, error: resp.message ?? trunk };
                });
              } else {
                updateImages(prompts, (prev) => {
                  return { ...prev, error: resp.message ?? trunk };
                });
              }
              continue;
            }

            const trunkWithoutPrefix = trunk.substring(6);
            if (likelyValidJson(trunkWithoutPrefix)) {
              // Complete json trunk
              handleImageResult(trunkWithoutPrefix);
              prevTrunk = "";
            } else if (trunkWithoutPrefix[0] === "{") {
              // Open
              prevTrunk = trunkWithoutPrefix;
            } else if (trunk[trunk.length - 1] === "}") {
              // Close
              handleImageResult(prevTrunk + trunk);
              prevTrunk = "";
            } else {
              // Middle trunks?
              prevTrunk += trunk;
            }
          }
        })
        .catch((e) => {
          console.error("Failed to generate image:", e);
          updateImages(prompts, (prev) => {
            return { ...prev, error: "Cannot generate right now." };
          });
        })
        .finally(() => {
          updateImages(prompts, (prev) => {
            return {
              ...prev,
              isWaiting: false,
              isGenerating: false,
            };
          });
        });
    },
    [imageModel.apiName, onUpdateGeneratedImage]
  );

  useEffect(() => {
    const last = lastElement;
    if (last == null || !story.isGenerating) {
      return;
    }
    last.scrollIntoView({
      block: "end",
    });
  }, [story.isGenerating, story.content, lastElement]);

  useEffect(() => {
    const toGenerate: string[] = [];

    setStoryImages((prev) => {
      const map = new Map<string, GenerativeImage>();

      for (const element of imageElements) {
        const image = element as Story.Image;
        const prompt = image.alt;
        if (prev.has(prompt)) {
          map.set(prompt, prev.get(prompt)!);
        } else {
          map.set(prompt, {
            prompt: prompt,
            error: null,
            url: image.url,
            isWaiting: true,
            isGenerating: false,
          });
          if (image.url == null) {
            toGenerate.push(prompt);
          }
        }
      }
      return map;
    });

    if (toGenerate.length === 0) {
      return;
    }

    generateImages(toGenerate);
  }, [imageElements, generateImages]);

  useEffect(() => {
    let hasGenerating = false;
    for (const image of storyImages.values()) {
      if (image.isGenerating) {
        hasGenerating = true;
        break;
      }
    }
    onUpdateHasGeneratingImages(hasGenerating);
  }, [storyImages, onUpdateHasGeneratingImages]);

  return (
    <div className={"relative " + (className ?? "")}>
      <div className={PAPER_BACKGROUND_CLASS}></div>

      <div
        className={PAPER_FOREGROUND_CLASS}
        style={{
          minHeight:
            minContentHeight != null ? minContentHeight + "px" : undefined,
        }}
      >
        {elements.length > 0 && !(elements[0] instanceof Story.Title) && (
          <StoryInfo
            prompt={story.prompt}
            textModel={story.textModel.humanName}
            imageModel={story.imageModel.humanName}
            isCreating={story.isGenerating}
            hasImages={imageElements.length > 0}
          />
        )}

        {elements.map((item, index) => {
          return (
            <div key={index}>
              <StoryElementItem
                item={item}
                images={storyImages}
                showActions={!isFrozen}
                onRegenerateImageClick={(prompt) => {
                  generateImages([prompt]);
                }}
              />

              {elements[0] instanceof Story.Title && index === 0 && (
                <StoryInfo
                  prompt={story.prompt}
                  textModel={story.textModel.humanName}
                  imageModel={story.imageModel.humanName}
                  isCreating={story.isGenerating}
                  hasImages={imageElements.length > 0}
                />
              )}
            </div>
          );
        })}
        <div className="h-4" ref={setLastElement}></div>
      </div>
    </div>
  );
}

function StoryElementItem({
  item,
  images,
  showActions,
  onRegenerateImageClick,
}: {
  item: StoryElement;
  images: Map<string, GenerativeImage>;
  showActions: boolean;
  onRegenerateImageClick: (prompt: string) => void;
}) {
  if (item instanceof Story.Title) {
    return <TitleItem title={item.title} />;
  } else if (item instanceof Story.Paragraph) {
    return <ParagraphItem content={item.content} />;
  } else if (item instanceof Story.Image) {
    const prompt = item.alt;
    const image = images.get(prompt);
    return (
      <PromptedImageItem
        prompt={prompt}
        error={image?.error ?? null}
        isGenerating={image?.isGenerating === true}
        src={image?.url}
        showActions={showActions}
        onRegenerateClick={() => {
          onRegenerateImageClick(prompt);
        }}
      />
    );
  } else {
    return <p>???</p>;
  }
}

function StoryInfo({
  prompt,
  textModel,
  imageModel,
  isCreating,
  hasImages,
}: {
  prompt: string;
  textModel: string;
  imageModel: string;
  isCreating: boolean;
  hasImages: boolean;
}) {
  return (
    <div className="mb-6 pl-2 text-gray-600 dark:text-gray-100 text-sm border-l-4 border-violet-500">
      <p>
        {isCreating ? "Creating" : "Created"} by {textModel}
        {hasImages ? " & " + imageModel : ""}
      </p>
      <p>Using prompt &apos;{prompt}&apos;</p>
    </div>
  );
}

function TitleItem({ title }: { title: string }) {
  return (
    <div className="mb-6 leading-10 tracking-wide font-serif font-bold text-4xl text-gray-900 dark:text-white">
      {title}
    </div>
  );
}

function ParagraphItem({ content }: { content: string }) {
  return (
    <div className="mb-6 font-serif text-lg leading-8 tracking-wide whitespace-pre-line break-words text-gray-900 dark:text-white">
      {content}
    </div>
  );
}

function PromptedImageItem({
  prompt,
  isGenerating,
  error,
  src,
  showActions,
  onRegenerateClick,
}: {
  prompt: string;
  isGenerating: boolean;
  error: string | null;
  src?: string | null;
  showActions: boolean;
  onRegenerateClick: () => void;
}) {
  const [isShowErrorPopup, setShowErrorPopup] = useState(false);
  return (
    <div className="mb-6">
      <div className="w-full aspect-[3/2] relative bg-gray-100 dark:bg-gray-600 overflow-hidden">
        <img
          className="w-full h-full scale-[1.01] object-cover"
          alt=""
          src={src ?? undefined}
        />

        <div className="absolute right-4 top-4">
          {isGenerating && <CircularLoader className="!fill-violet-500" />}
        </div>

        <div className="absolute right-4 bottom-4 flex items-center">
          {error != null && showActions && (
            <ClickAwayListener onClickAway={() => setShowErrorPopup(false)}>
              <div>
                <Tooltip
                  open={isShowErrorPopup}
                  disableHoverListener
                  title={<p className="text-base">{error}</p>}
                >
                  <div
                    className="mr-4 aspect-square flex items-center bg-red-500/60 hover:bg-red-500/80 cursor-pointer"
                    onClick={() => setShowErrorPopup((prev) => !prev)}
                  >
                    <InformationCircleIcon className="w-5 h-5 m-1 text-white" />
                  </div>
                </Tooltip>
              </div>
            </ClickAwayListener>
          )}

          {!isGenerating && showActions && (
            <div
              className="aspect-square flex items-center bg-black/60 hover:bg-violet-400/40 cursor-pointer"
              onClick={onRegenerateClick}
            >
              <ArrowPathIcon className="w-5 h-5 m-1 text-white" />
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 font-serif text-sm text-center text-gray-500 dark:text-gray-300">
        {prompt}
      </p>
    </div>
  );
}
