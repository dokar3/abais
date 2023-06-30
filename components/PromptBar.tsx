"use client";

import { MuiStyles } from "@/styles/MuiStyles";
import { Model } from "@/data/models";
import {
  AdjustmentsVerticalIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Menu } from "@mui/material";
import React, { useState } from "react";

export default function PromptBar({
  className,
  hint,
  content,
  submitDisabled,
  textModel,
  imageModel,
  onUpdateContent,
  onUpdateTextModel,
  onUpdateImageModel,
  onSubmit,
}: {
  className?: string;
  hint: string;
  content: string;
  submitDisabled?: boolean;
  textModel: Model;
  imageModel: Model;
  onUpdateContent: (value: string) => void;
  onUpdateTextModel: (model: Model) => void;
  onUpdateImageModel: (model: Model) => void;
  onSubmit: () => void;
}) {
  const [isFocused, setFocused] = useState(false);

  const [isShowSettings, setShowSettings] = useState(false);

  const [settingsBtnElement, setSettingsBtnElement] =
    useState<HTMLDivElement | null>(null);

  return (
    <div
      className={
        "w-full flex justify-between items-center bg-white dark:bg-gray-800 border-2 " +
        (isFocused ? "border-violet-500 " : "border-gray-500 ") +
        (className ?? "")
      }
    >
      <input
        className="px-4 w-full text-lg text-gray-900 dark:text-white outline-none bg-transparent"
        value={content}
        placeholder={hint}
        maxLength={parseInt(process.env.NEXT_PUBLIC_MAX_INPUT_CHARS ?? "200")}
        onChange={(e) => {
          onUpdateContent(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && submitDisabled !== true) {
            onSubmit();
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div className="flex items-center">
        <div
          className="mr-2 flex items-center"
          ref={setSettingsBtnElement}
          onClick={() => setShowSettings((prev) => !prev)}
        >
          <AdjustmentsVerticalIcon className="w-6 h-6 text-gray-600 dark:text-gray-200 hover:text-violet-500" />
        </div>

        <div
          className={
            "p-2 aspect-square flex items-center " +
            (submitDisabled === true
              ? "bg-gray-200"
              : "bg-violet-500 hover:bg-violet-600 text-white cursor-pointer")
          }
          onClick={() => {
            if (submitDisabled !== true) {
              onSubmit();
            }
          }}
        >
          <SparklesIcon className="w-5 h-5" />
        </div>
      </div>

      <SettingsPopup
        open={isShowSettings}
        anchor={settingsBtnElement}
        textModel={textModel}
        imageModel={imageModel}
        onClose={() => setShowSettings(false)}
        onUpdateTextModel={onUpdateTextModel}
        onUpdateImageModel={onUpdateImageModel}
      />
    </div>
  );
}

const TEXT_MODELS = [Model.Text.GPT_35_Turbo, Model.Text.GPT_4];

const IMAGE_MODELS = [
  Model.Image.StableDiffusion_1_4,
  Model.Image.StableDiffusion_1_5,
  Model.Image.StableDiffusion_2_1,
  Model.Image.StableDiffusion_2_1_Base,
  Model.Image.StableDiffusion_Herge_Style,
];

function SettingsPopup({
  open,
  anchor,
  textModel,
  imageModel,
  onClose,
  onUpdateTextModel,
  onUpdateImageModel,
}: {
  open: boolean;
  anchor: HTMLDivElement | null;
  textModel: Model;
  imageModel: Model;
  onClose: () => void;
  onUpdateTextModel: (model: Model) => void;
  onUpdateImageModel: (model: Model) => void;
}) {
  const [isShowTextModelSelector, setShowTextModelSelector] = useState(false);
  const [isShowImageModelSelector, setShowImageModelSelector] = useState(false);

  const [textModelAnchor, setTextModelAnchor] = useState<HTMLDivElement | null>(
    null
  );
  const [imageModelAnchor, setImageModelAnchor] =
    useState<HTMLDivElement | null>(null);

  return (
    <Menu
      open={open}
      anchorEl={anchor}
      onClose={onClose}
      slotProps={{
        paper: MuiStyles.Popup.paperPropsLarge({ minWidth: "300px" }),
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <div className="px-4 py-2">
        <div className="text-violet-500 font-bold">Models</div>

        <SelectorBox
          ref={setTextModelAnchor}
          title="Text model"
          value={textModel.humanName}
          onClick={() => setShowTextModelSelector(true)}
        />

        <SelectorBox
          ref={setImageModelAnchor}
          title="Image model"
          value={imageModel.humanName}
          onClick={() => setShowImageModelSelector(true)}
        />
      </div>

      <ModelSelector
        open={isShowTextModelSelector}
        anchor={textModelAnchor}
        selected={textModel}
        items={TEXT_MODELS}
        onClose={() => setShowTextModelSelector(false)}
        onSelect={onUpdateTextModel}
      />

      <ModelSelector
        open={isShowImageModelSelector}
        anchor={imageModelAnchor}
        selected={imageModel}
        items={IMAGE_MODELS}
        onClose={() => setShowImageModelSelector(false)}
        onSelect={onUpdateImageModel}
      />
    </Menu>
  );
}

type SelectorBoxProps = {
  title: string;
  value: string;
  onClick: () => void;
};

const SelectorBox = React.forwardRef<HTMLDivElement, SelectorBoxProps>(
  (props, ref) => {
    return (
      <>
        <p className="mt-2 mb-1 text-sm">{props.title}</p>
        <div
          ref={ref}
          onClick={props.onClick}
          className="flex justify-between items-center px-1 border-2 border-gray-500 cursor-pointer"
        >
          <div>{props.value}</div>
          <div className="ml-2 shrink-0">
            <ChevronDownIcon className="w-5 h-5" />
          </div>
        </div>
      </>
    );
  }
);

function ModelSelector({
  open,
  anchor,
  selected,
  items,
  onSelect,
  onClose,
}: {
  open: boolean;
  anchor: HTMLDivElement | null;
  selected: Model;
  items: Model[];
  onClose: () => void;
  onSelect: (model: Model) => void;
}) {
  return (
    <Menu
      open={open}
      anchorEl={anchor}
      onClose={onClose}
      slotProps={{
        paper: MuiStyles.Popup.paperPropsLarge({ minWidth: "280px" }),
      }}
      anchorOrigin={{ horizontal: "center", vertical: "center" }}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <ul>
        {items.map((item, idx) => (
          <div
            key={idx}
            className={
              "flex justify-between items-center py-2 px-4 " +
              (item.available
                ? "cursor-pointer hover:bg-violet-100 hover:bg-violet-500/50"
                : "opacity-50")
            }
            onClick={() => {
              if (item.available) {
                onSelect(item);
                onClose();
              }
            }}
          >
            <p>{item.humanName}</p>
            {selected.apiName === item.apiName && (
              <div className="ml-2 shrink-0">
                <CheckIcon className="w-5 h-5 text-violet-500" />
              </div>
            )}
          </div>
        ))}
      </ul>
    </Menu>
  );
}
