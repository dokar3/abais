import { Story } from "@/data/story";
import { AppContext } from "@/lib/AppContext";
import { MuiStyles } from "@/styles/MuiStyles";
import { StoryParser } from "@/utils/storyParser";
import { Dialog, DialogActions, DialogContent } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import CircularLoader from "./CircularLoader";
import { GeneratedImage } from "./StoryPaper";

export default function ShareStoryDialog({
  open,
  story,
  storyUrl,
  isStoryShared,
  generatedImages,
  onClose,
  onStoryShared,
}: {
  open: boolean;
  story: Story;
  storyUrl: string | null;
  isStoryShared: boolean;
  generatedImages: Map<string, GeneratedImage>;
  onClose: () => void;
  onStoryShared: (url: string) => void;
}) {
  const { username } = useContext(AppContext);

  const [shareUsername, setShareUsername] = useState(username);

  const [isSharing, setSharing] = useState(false);

  const [isUrlCopied, setUrlCopied] = useState(false);

  const storyTitle = React.useMemo(
    () => StoryParser.resolveTitle(story.contentElements ?? []),
    [story.contentElements]
  );

  const allImageCount = React.useMemo(() => {
    return (story.contentElements ?? []).filter(
      (item) => item instanceof Story.Image
    ).length;
  }, [story.contentElements]);

  const share = useCallback(() => {
    if (story == null) {
      return;
    }

    if (story.isGenerating) {
      return;
    }

    const contentElements = story.contentElements;
    if (contentElements == null || contentElements.length === 0) {
      return;
    }
    const content = StoryParser.buildFromElements(
      contentElements,
      generatedImages
    );

    const titleEle = story.contentElements?.find(
      (item) => item instanceof Story.Title
    ) as Story.Title;
    const title = titleEle != null ? titleEle.title : "Untitled";

    setSharing(true);

    fetch("/api/story/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: story.prompt,
        title: title,
        content: content,
        shareUser: shareUsername,
        textModel: story.textModel.apiName,
        imageModel: story.imageModel.apiName,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok !== true) {
          alert("Failed to share: " + res.message);
        } else {
          const url = res.data.url;
          onStoryShared(url);
        }
      })
      .finally(() => {
        setSharing(false);
      });
  }, [story, generatedImages, shareUsername]);

  useEffect(() => {
    setShareUsername(username);
  }, [username]);

  useEffect(() => {
    if (!isUrlCopied) {
      return;
    }
    const tid = setTimeout(() => {
      setUrlCopied(false);
    }, 3000);
    return () => {
      clearTimeout(tid);
    };
  }, [isUrlCopied]);

  useEffect(() => {
    if (open) {
      setUrlCopied(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSharing) {
          onClose();
        }
      }}
      slotProps={{
        backdrop: MuiStyles.Dialog.backdrop,
      }}
      PaperProps={{
        style: {
          ...MuiStyles.Dialog.style,
          width: "560px",
          maxWidth: "85vw",
        },
      }}
    >
      <DialogContent>
        <p className="mb-4 text-lg font-bold">Share Story</p>

        <div className="mb-4">
          <p className="mb-2 text-violet-500 text-sm">Title</p>
          <p className="font-bold">{storyTitle}</p>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-violet-500 text-sm">Generated images</p>
          <p>
            {generatedImages.size} / {allImageCount}
          </p>
        </div>

        <div>
          <p className="mb-2 text-violet-500 text-sm">By</p>
          <input
            value={shareUsername}
            className="w-full p-1 outline-none bg-transparent border-2 border-gray-500 focus:border-violet-500"
            required
            onChange={(e) => setShareUsername(e.target.value)}
            maxLength={20}
          />
        </div>

        {isStoryShared && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-violet-500 text-sm">
              Story has been shared!
            </p>

            <div className="flex justify-between items-center">
              <input
                className="w-full p-1 mr-4 bg-transparent outline-none border-2 border-gray-500 focus:border-violet-500"
                value={storyUrl ?? ""}
              />
              <button
                className="shrink-0 py-1 px-2 text-white bg-violet-500 hover:bg-violet-600"
                disabled={isUrlCopied}
                onClick={() => {
                  if (storyUrl != null) {
                    navigator.clipboard.writeText(storyUrl);
                    setUrlCopied(true);
                  }
                }}
              >
                {isUrlCopied ? "Link Copied" : "Copy Link"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions className="mx-4 mb-4">
        <button
          className={
            "mr-2 px-2 py-1 border-2 border-gray-400 " +
            (isSharing ? "opacity-75" : "hover:bg-gray-100 dark:hover:bg-gray-500")
          }
          onClick={onClose}
          disabled={isSharing}
        >
          Cancel
        </button>
        <button
          className={
            "px-2 py-1 flex items-center text-white border-2 border-violet-500 bg-violet-500 " +
            (isSharing
              ? "opacity-75"
              : "hover:border-violet-600 hover:bg-violet-600 ")
          }
          onClick={() => {
            if (!isStoryShared) {
              share();
            } else {
              onClose();
            }
          }}
          disabled={isSharing}
        >
          <p>{isSharing ? "Sharing" : isStoryShared ? "OK" : "Share"}</p>
          {isSharing && (
            <CircularLoader className="ml-2 !w-4 !h-4 fill-white" />
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
}
