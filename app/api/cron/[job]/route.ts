import { GeneratedImages } from "@/data/GeneratedImages";
import prisma from "@/lib/prisma";
import { ImageType } from "@prisma/client";
import { NextResponse } from "next/server";

const TEMP_IMAGE_EXPIRATION_MILLIS = 1000 * 60 * 60 * 24; // 1 day

export async function GET(req: Request) {
  const url = req.url;
  const job = url.substring(url.lastIndexOf("/") + 1);

  switch (job) {
    case "clean-temp-images": {
      return cleanTempImages();
    }
    default: {
      return NextResponse.json({ ok: false, message: `Unknown job: [${job}]` });
    }
  }
}

async function cleanTempImages() {
  const expiredAt = Date.now() - TEMP_IMAGE_EXPIRATION_MILLIS;
  const expiredTempImages = await prisma.generatedImage.findMany({
    where: {
      AND: [
        {
          type: ImageType.Temporary,
        },
        {
          at: { lte: expiredAt },
        },
      ],
    },
  });
  for (const image of expiredTempImages) {
    const ret = await GeneratedImages.deleteImage(image);
    if (!ret.ok) {
      console.error("Failed to delete image, url:", image.url);
    }
  }
  return NextResponse.json({ ok: true });
}
