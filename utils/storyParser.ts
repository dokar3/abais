import { GeneratedImage } from "@/components/StoryPaper";
import { Story, StoryElement } from "../data/story";

export namespace StoryParser {
  const defAllowedImageUrlPrefix = process.env
    .NEXT_PUBLIC_S3_PUB_URL_PREFIX as string;

  /**
   * Very simple markdown parsing, it only parses:
   * 1) '# TEXT' as title;
   * 2) '![IMAGE ALT](*)' as prompted image;
   * 3) Other content as paragraphs.
   */
  export function parse(
    story: string,
    allowedImageUrlPrefix?: string
  ): StoryElement[] {
    if (story.length === 0) {
      return [];
    }

    const elements: StoryElement[] = [];

    function addParagraph(content: string) {
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        return;
      }
      elements.push(new Story.Paragraph({ content: trimmed }));
    }

    function addTitle(title: string) {
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        return;
      }
      elements.push(new Story.Title({ title: trimmed }));
    }

    function addPromptImage(prompt: string, url: string | null) {
      const trimmed = prompt.trim();
      if (trimmed.length === 0) {
        return;
      }
      const allowedPrefix = allowedImageUrlPrefix ?? defAllowedImageUrlPrefix;
      const finalUrl =
        url != null && url.startsWith(allowedPrefix) ? url : null;
      elements.push(new Story.Image({ prompt: trimmed, url: finalUrl }));
    }

    function addTextElement(content: string) {
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("# ")) {
          addTitle(line.substring(2));
        } else {
          addParagraph(line);
        }
      }
    }

    const imgPromptRegex = /\!\[(.+)\]\((.*)\)/g;
    let match;
    let prevEndIdx = 0;
    while ((match = imgPromptRegex.exec(story)) !== null) {
      const startIndex = match.index;
      const endIndex = imgPromptRegex.lastIndex;

      if (startIndex > prevEndIdx) {
        addTextElement(story.substring(prevEndIdx, startIndex).trim());
      }

      addPromptImage(match[1], match[2]);

      prevEndIdx = endIndex;
    }

    if (prevEndIdx !== story.length) {
      addTextElement(story.substring(prevEndIdx).trim());
    }

    return elements;
  }

  export function buildFromElements(
    elements: StoryElement[],
    generatedImages: Map<string, GeneratedImage>
  ): string {
    if (elements.length === 0) {
      return "";
    }
    let content = "";
    for (const element of elements) {
      if (element instanceof Story.Title) {
        content += `# ${element.title}\n\n`;
      } else if (element instanceof Story.Paragraph) {
        content += `${element.content}\n\n`;
      } else if (element instanceof Story.Image) {
        const generated = generatedImages.get(element.alt);
        const targetUrl = generated != null ? generated.url : element.url;
        content += `![${element.alt}](${targetUrl ?? ""})\n\n`;
      } else {
        throw Error("Unsupported element: " + element);
      }
    }
    return content.trim();
  }

  export function resolveTitle(elements: StoryElement[]): string | null {
    const element = elements.find((item) => item instanceof Story.Title);
    if (element == null) {
      return null;
    }
    return (element as Story.Title).title;
  }
}
