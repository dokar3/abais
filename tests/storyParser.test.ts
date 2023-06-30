import { Story } from "@/data/story";
import { StoryParser } from "@/utils/storyParser";

describe("story parser", () => {
  test("parse stories", () => {
    const story = `Once upon a time in ...
        ![An image of red moon]()
        The end
        `;
    const parser = StoryParser;
    const result = parser.parse(story);
    expect(result.length).toBe(3);
    expect((result[0] as Story.Paragraph).content).toBe(
      "Once upon a time in ..."
    );
    expect((result[1] as Story.Image).alt).toBe(
      "An image of red moon"
    );
    expect((result[2] as Story.Paragraph).content).toBe("The end");
  });
});
