import { GeneratedImages } from "@/data/GeneratedImages";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const secret = req.headers.get("api-call-secret");
  if (secret !== process.env.INTERNAL_API_CALL_SECRET) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const prompt = req.headers.get("image-prompt");
  if (typeof prompt !== "string") {
    return NextResponse.json(
      { ok: false, message: "Require string prompt to save image" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await req.text(), "base64");

  const saveRet = await GeneratedImages.saveAsTemporary({
    prompt: prompt,
    filename: uuidv4() + ".jpg",
    buffer: buffer,
  });

  return NextResponse.json(saveRet);
}
