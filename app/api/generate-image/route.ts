import { NextResponse } from "next/server";

type GenerateResult = {
  ok: boolean;
  message?: string;
  data?: GeneratedData;
};

type GeneratedData = {
  buffer: Buffer;
};

async function generateImage(
  hfModel: string,
  prompt: string
): Promise<GenerateResult> {
  let arrayBuffer: ArrayBuffer;
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/" + hfModel,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    arrayBuffer = await response.arrayBuffer();
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Something went wrong." };
  }

  if (arrayBuffer.byteLength === 0) {
    return { ok: false, message: "No data returned from model." };
  }

  const buffer = Buffer.from(arrayBuffer);

  const text = buffer.toString();
  try {
    const resp = JSON.parse(text);
    if (resp.error != null) {
      return { ok: false, message: resp.error };
    }
  } catch (e) {}

  return {
    ok: true,
    data: { buffer: buffer },
  };
}

export const runtime = "edge";

const GENERATE_TIMEOUT = 55000;

export async function POST(req: Request) {
  const body = await req.json();

  const model = body.model as string;
  if (model == null || model.length === 0) {
    return NextResponse.json(
      { ok: false, message: "No model provided." },
      { status: 400 }
    );
  }

  const prompts = body.prompts as string[];
  if (prompts == null || prompts.length === 0) {
    return NextResponse.json(
      { ok: false, message: "No prompts provided." },
      { status: 400 }
    );
  }

  const port = new URL(req.url).port;

  const pullData = async (
    controller: ReadableStreamDefaultController<Uint8Array>
  ) => {
    const textEncoder = new TextEncoder();
    const emitText = (text: string) => {
      controller.enqueue(textEncoder.encode(text));
    };

    for (const prompt of prompts) {
      let isTimedOut = false;

      const tid = setTimeout(() => {
        const ret = {
          ok: false,
          prompt: prompt,
          message: "Request timed out.",
        };
        emitText(`data: ${JSON.stringify(ret)}`);
        isTimedOut = true;
      }, GENERATE_TIMEOUT);

      const result = await generateImage(model, prompt);
      if (!result.ok) {
        emitText(`data: ${JSON.stringify(result)}`);
        continue;
      }

      if (isTimedOut) {
        continue;
      }

      clearTimeout(tid);

      const data = result.data;
      if (data == null) {
        const ret = { ok: false, message: "No data received." };
        emitText(`data: ${JSON.stringify(ret)}`);
        continue;
      }

      const saveRet = await saveImage({
        port: port,
        prompt: prompt,
        buffer: data.buffer,
      });
      if (saveRet.ok !== true || saveRet.data == null) {
        const ret = { ok: false, message: "Generated image is unavailable." };
        emitText(`data: ${JSON.stringify(ret)}`);
        continue;
      }

      const respJson = JSON.stringify({
        prompt: prompt,
        url: saveRet.data,
      });
      console.log("Enqueue data: ", respJson);
      emitText(`data: ${respJson}\n\n`);
    }

    controller.close();
  };

  const readableStream = new ReadableStream<Uint8Array>({ pull: pullData });

  return new Response(readableStream, {
    headers: {
      // SSE headers
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/event-stream;charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function saveImage({
  port,
  prompt,
  buffer,
}: {
  port: string;
  prompt: string;
  buffer: Buffer;
}) {
  const baseUrl =
    process.env.INTERNAL_API_BASE_URL +
    (port != null && port.length > 0 ? `:${port}` : "");
  const requestUrl = `${baseUrl}/api/generate-image/save`;
  return await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Image-Prompt": prompt,
      "Api-Call-Secret": process.env.INTERNAL_API_CALL_SECRET!,
    },
    body: buffer.toString("base64"),
  }).then((res) => res.json());
}
