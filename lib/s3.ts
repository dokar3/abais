import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type S3OptResult = {
  ok: boolean;
  data?: any;
  message?: string;
};

export namespace S3 {
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.S3_BUCKET_NAME;

  export function keyForImage(filename: string): string {
    return "images/" + filename;
  }

  export function publicUrl(key: string): string {
    return `${process.env.NEXT_PUBLIC_S3_PUB_URL_PREFIX}/${key}`;
  }

  export async function uploadFile({
    key,
    buffer,
  }: {
    key: string;
    buffer: Buffer;
  }): Promise<S3OptResult> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
    });

    try {
      const response = await client.send(command);
      return { ok: true, data: response };
    } catch (err) {
      console.error(err);
      return { ok: false, message: err?.toString() ?? "Unknown error." };
    }
  }

  export async function deleteFile({
    key,
  }: {
    key: string;
  }): Promise<S3OptResult> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      const response = await client.send(command);
      console.log("DeleteResponse:\n", response);
      return { ok: true, data: response };
    } catch (err) {
      console.error(err);
      return { ok: false, message: err?.toString() ?? "Unknown error." };
    }
  }
}
