import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { resolveVisitorAndStory } from "../../../data/server/resolveVisitorStory";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const props = await resolveVisitorAndStory(req, res);
  if (props == null) {
    return;
  }
  const [visitor, story] = props;

  const likes = story.likes;
  const index = likes.findIndex((like) => like.id === visitor.id);
  if (index === -1) {
    res.json({ ok: true });
    return;
  }

  const updatedLikes = Array.from(likes);
  updatedLikes.splice(index, 1);
  await prisma.story.update({
    where: { id: story.id },
    data: { likes: updatedLikes },
  });

  res.json({ ok: true });
}
