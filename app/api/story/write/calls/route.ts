import prisma from "@/lib/prisma";
import { DateUtil } from "@/utils/date";
import { NextResponse } from "next/server";

const MAX_WRITE_STORIES_PER_DAY = parseInt(
  process.env.MAX_REQUEST_PER_IP_PER_DAY ?? "20"
);

// A workaround route to circumvent limitations of vercel's edge functions.
export async function POST(req: Request) {
  const secret = req.headers.get("api-call-secret");
  if (secret !== process.env.INTERNAL_API_CALL_SECRET) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const action = body.action;

  switch (action) {
    case "request": {
      return requestWrite(body.requesterIp);
    }
    case "add-record": {
      return addWriteRecord(body.requesterIp);
    }
    default: {
      return NextResponse.json({
        ok: false,
        message: `Unknown action [${action}]`,
      });
    }
  }
}

async function requestWrite(ip: string | null): Promise<Response> {
  function forbiddenWriting(reason: string = "Writing is not available now.") {
    return NextResponse.json({ ok: false, message: reason }, { status: 403 });
  }

  if (ip == null) {
    return forbiddenWriting();
  }

  const visitor = await prisma.visitor.findFirst({ where: { ip: ip } });
  if (visitor == null) {
    return forbiddenWriting();
  }

  const count = await countWroteStoryToday(visitor.id);
  if (count >= MAX_WRITE_STORIES_PER_DAY) {
    return forbiddenWriting(
      "Seems you have generate " +
        MAX_WRITE_STORIES_PER_DAY +
        " stories today, maybe try it tomorrow?"
    );
  }

  return NextResponse.json({ ok: true });
}

async function countWroteStoryToday(userId: string) {
  const dateRange = DateUtil.getStartAndEndOfDayMs();
  return await prisma.writeRequest.count({
    where: {
      AND: [
        {
          userId: userId,
        },
        {
          at: { gte: dateRange[0], lte: dateRange[1] },
        },
      ],
    },
  });
}

async function addWriteRecord(ip: string | null): Promise<Response> {
  if (ip == null) {
    return NextResponse.json({ ok: false, message: "Require ip to record." });
  }

  const visitor = await prisma.visitor.findFirst({ where: { ip: ip } });
  if (visitor == null) {
    return NextResponse.json({
      ok: false,
      message: "Visitor not found, ip: " + ip,
    });
  }
  await prisma.writeRequest.create({
    data: {
      userId: visitor.id,
      at: Date.now(),
    },
  });
  return NextResponse.json({ ok: true });
}
