import { S3 } from "@/lib/s3";
import { FetchResult } from "./fetcher/fetchResult";
import prisma from "@/lib/prisma";
import { GeneratedImage, ImageType } from "@prisma/client";

export namespace GeneratedImages {
  export async function saveAsTemporary({
    prompt,
    filename,
    buffer,
  }: {
    prompt: string;
    filename: string;
    buffer: Buffer;
  }): Promise<FetchResult<string>> {
    // Upload to S3
    const uploadKey = S3.keyForImage(filename);
    const uploadRes = await S3.uploadFile({
      key: uploadKey,
      buffer: buffer,
    });
    if (uploadRes.ok !== true) {
      console.error("Cannot upload image to s3", uploadRes.message);
      return { ok: false, message: "Generated image unavailable." };
    }
    const url = S3.publicUrl(uploadKey);

    // Save a record
    await prisma.generatedImage.create({
      data: {
        prompt: prompt,
        url: url,
        type: ImageType.Temporary,
        at: Date.now(),
      },
    });

    return { ok: true, data: url };
  }

  export async function deleteImage(
    image: GeneratedImage
  ): Promise<FetchResult<string>> {
    const url = new URL(image.url);
    const path = url.pathname;
    // Upload to S3
    const res = await S3.deleteFile({
      key: path,
    });
    if (res.ok !== true) {
      console.error("Cannot upload image to s3", res.message);
      return { ok: false, message: "Generated image unavailable." };
    }

    // Delete record
    await prisma.generatedImage.delete({ where: { id: image.id } });

    return { ok: true };
  }
}
