import prisma from "@/lib/prisma";
import { HeaderUtil } from "@/utils/headers";
import { Story, Visitor } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

type RequestProps = {
  id: string;
};

export async function resolveVisitorAndStory(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<[Visitor, Story] | null> {
  if (req.method !== "POST") {
    res.status(400).json({ ok: false, message: "Unsupported method." });
    return null;
  }

  function forbiddenLike(reason: string = "Unavailable.") {
    res.status(403).json({ ok: false, message: reason });
  }

  const ip = HeaderUtil.getIpAddressNextRequest(req);
  if (ip == null) {
    forbiddenLike();
    return null;
  }

  const visitor = await prisma.visitor.findFirst({ where: { ip: ip } });
  if (visitor == null) {
    forbiddenLike();
    return null;
  }

  const { id } = (await req.body) as RequestProps;
  if (id == null) {
    res.status(400).json({ ok: false, message: "No id provided." });
    return null;
  }

  const story = await prisma.story.findFirst({ where: { id: id } });
  if (story == null) {
    res.status(400).json({ ok: false, message: "Story does not exist." });
    return null;
  }

  return [visitor, story];
}
