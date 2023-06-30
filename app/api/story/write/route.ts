import { HeaderUtil } from "@/utils/headers";
import { buildRequestMessages } from "@/utils/storyRequestBuilder";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai-edge";

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig, undefined);

type RequestProps = {
  prompt: string;
  model?: string;
};

export const runtime = "edge";

export async function POST(req: Request) {
  const body = (await req.json()) as RequestProps;
  console.log("Request body:", body);

  const prompt = body.prompt;
  if (prompt == null) {
    return NextResponse.json(
      { ok: false, message: "Please provide a prompt." },
      { status: 400 }
    );
  }
  const model = body.model != null ? body.model : "gpt-3.5-turbo";

  function forbiddenWriting(reason: string = "Writing is not available now.") {
    return NextResponse.json({ ok: false, message: reason }, { status: 403 });
  }

  const ip = HeaderUtil.getIpAddress(req);
  if (ip == null) {
    return forbiddenWriting();
  }

  const port = new URL(req.url).port;

  // Auth, check rate limits, etc.
  const requestRes = await callApi({
    port: port,
    action: "request",
    body: {
      requesterIp: ip,
    },
  });
  if (requestRes.ok !== true) {
    return NextResponse.json(requestRes);
  }

  try {
    const maxChars = parseInt(process.env.NEXT_PUBLIC_MAX_INPUT_CHARS ?? "200");
    const messages = buildRequestMessages(prompt.substring(0, maxChars));

    const response = await openai.createChatCompletion({
      model: model,
      stream: true,
      max_tokens: parseInt(process.env.MAX_GENERATE_TOKENS ?? "500"),
      messages,
    });
    const stream = OpenAIStream(response, {
      onCompletion: async () => {
        // Add a record
        const addRecordRes = await callApi({
          port: port,
          action: "add-record",
          body: {
            requesterIp: ip,
          },
        });
        if (addRecordRes.ok !== true) {
          console.error("Cannot add record: ", addRecordRes.message);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, message: "Failed to request." });
  }
}

async function callApi({
  port,
  action,
  body,
}: {
  port: string;
  action: "request" | "add-record";
  body: any;
}) {
  const baseUrl =
    process.env.INTERNAL_API_BASE_URL +
    (port != null && port.length > 0 ? `:${port}` : "");
  try {
    return await fetch(`${baseUrl}/api/story/write/calls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Call-Secret": process.env.INTERNAL_API_CALL_SECRET!,
      },
      body: JSON.stringify({
        action: action,
        ...body,
      }),
    }).then((res) => res.json());
  } catch (e) {
    console.log("Failed to call internal api:", e);
    return { ok: false, message: "Internal error: Failed to request." };
  }
}
