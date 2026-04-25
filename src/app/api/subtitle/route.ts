import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

const srtToVtt = (srt: string): string => {
  const normalized = srt
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // 时间戳行的逗号毫秒分隔符替换为点
  // 例: 00:00:01,000 --> 00:00:04,000  =>  00:00:01.000 --> 00:00:04.000
  const converted = normalized.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/g,
    "$1.$2 --> $3.$4",
  );

  return `WEBVTT\n\n${converted}`;
};

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("filePath");
  if (!filePath) {
    return NextResponse.json({ error: "缺少文件名参数" }, { status: 400 });
  }

  if (!filePath.toLowerCase().endsWith(".srt")) {
    return NextResponse.json({ error: "仅支持 .srt 字幕" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  try {
    const srt = await fs.promises.readFile(filePath, "utf-8");
    const vtt = srtToVtt(srt);
    return new NextResponse(vtt, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "无法读取字幕" }, { status: 500 });
  }
}
