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
  if (likes.find((like) => like.id === visitor.id) != null) {
    res.json({ ok: true });
    return;
  }

  const updatedLikes = Array.from(likes);
  updatedLikes.push({ id: visitor.id, at: Date.now() });
  await prisma.story.update({
    where: { id: story.id },
    data: { likes: updatedLikes },
  });

  res.json({ ok: true });
}
