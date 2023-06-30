import { Model } from "./models";

export type Story = {
  prompt: string;
  textModel: Model;
  imageModel: Model;
  isGenerating: boolean;
  content: string | null;
  contentElements: StoryElement[] | null;
  error: string | null;
};

export interface StoryElement {}

export namespace Story {
  export class Title implements StoryElement {
    readonly title: string;
    constructor({ title }: { title: string }) {
      this.title = title;
    }
  }

  export class Paragraph implements StoryElement {
    readonly content: string;

    constructor({ content }: { content: string }) {
      this.content = content;
    }
  }

  export class Image implements StoryElement {
    readonly alt: string;

    readonly url: string | null;

    constructor({ prompt, url }: { prompt: string; url: string | null }) {
      this.alt = prompt;
      this.url = url;
    }
  }
}
