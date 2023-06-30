import { DateUtil } from "@/utils/date";
import { HeaderUtil } from "@/utils/headers";
import { ImageType, UserType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { StoryParser } from "@/utils/storyParser";
import { Story } from "@/data/story";

const MAX_SHARE_STORIES_PER_DAY = parseInt(
  process.env.MAX_REQUEST_PER_IP_PER_DAY ?? "20"
);

type ShareProps = {
  prompt: string;
  title: string;
  content: string;
  textModel: string;
  imageModel: string;
  shareUsername: string | null;
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { prompt, title, content, textModel, imageModel, shareUsername } =
    (await req.body) as ShareProps;

  if (isNullOrEmpty(prompt)) {
    res
      .status(400)
      .json({ ok: false, message: "Non-empty 'prompt' required." });
    return;
  }
  if (isNullOrEmpty(title)) {
    res.status(400).json({ ok: false, message: "Non-empty 'title' required." });
    return;
  }
  if (isNullOrEmpty(content)) {
    res
      .status(400)
      .json({ ok: false, message: "Non-empty 'content' required." });
    return;
  }
  if (isNullOrEmpty(textModel)) {
    res
      .status(400)
      .json({ ok: false, message: "Non-empty 'textModel' required." });
    return;
  }
  if (isNullOrEmpty(imageModel)) {
    res
      .status(400)
      .json({ ok: false, message: "Non-empty 'imageModel' required." });
    return;
  }

  function forbiddenSharing(reason: string = "Sharing is not available now.") {
    res.status(403).json({ ok: false, message: reason });
  }

  const ip = HeaderUtil.getIpAddressNextRequest(req);
  if (ip == null) {
    forbiddenSharing();
    return;
  }

  const visitor = await prisma.visitor.findFirst({ where: { ip: ip } });
  if (visitor == null) {
    forbiddenSharing();
    return;
  }

  const sharedCountToday = await countSharedStoryToday(visitor.id);
  if (sharedCountToday >= MAX_SHARE_STORIES_PER_DAY) {
    forbiddenSharing(
      "Seems you have shared " +
        MAX_SHARE_STORIES_PER_DAY +
        " stories today, maybe try it tomorrow?"
    );
    return;
  }

  const elements = StoryParser.parse(content).filter((item) => {
    if (item instanceof Story.Image && isNullOrEmpty(item.url)) {
      // Exclude images that have not been generated
      return false;
    }
    return true;
  });
  if (elements.length === 0) {
    forbiddenSharing("Seems there is nothing in this story?!");
    return;
  }

  const images = elements
    .filter((item) => item instanceof Story.Image)
    .map((item) => item as Story.Image);
  const hasImage = images.length > 0;
  if (hasImage) {
    markImagesAsPersistent(images);
  }

  const cover = hasImage ? images[0].url : null;

  const result = await prisma.story.create({
    data: {
      prompt: prompt,
      title: title,
      cover: cover,
      content: content,
      textModel: textModel,
      imageModel: imageModel,
      shareUserId: visitor.id,
      shareUsername: shareUsername ?? visitor.name,
      shareUserType: UserType.Visitor,
      likes: [],
      sharedAt: Date.now(),
    },
  });

  res.json({
    ok: true,
    data: { ...result, url: buildStoryUrl(result.id) },
  });
}

function isNullOrEmpty(text: string | null) {
  return text == null || text.length === 0;
}

async function countSharedStoryToday(userId: string) {
  const dateRange = DateUtil.getStartAndEndOfDayMs();
  return await prisma.story.count({
    where: {
      AND: [
        {
          shareUserId: userId,
        },
        {
          sharedAt: { gte: dateRange[0], lte: dateRange[1] },
        },
      ],
    },
  });
}

function buildStoryUrl(id: string): string {
  return "https://" + process.env.HOSTED_DOMAIN + "/story/" + id;
}

async function markImagesAsPersistent(images: Story.Image[]) {
  const urls = images
    .filter((item) => item.url != null)
    .map((item) => item.url!);
  await prisma.generatedImage.updateMany({
    where: {
      url: {
        in: urls,
      },
    },
    data: {
      type: ImageType.Persistent,
    },
  });
}
