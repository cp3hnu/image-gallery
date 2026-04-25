import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
};

// 把 Node 文件流包装成 Web ReadableStream，并妥善处理客户端中途断开的情况，
// 避免出现 "Invalid state: Controller is already closed" 噪音报错。
const toSafeWebStream = (nodeStream: fs.ReadStream, signal: AbortSignal): ReadableStream<Uint8Array> => {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (!nodeStream.destroyed) nodeStream.destroy();
      };

      if (signal.aborted) {
        cleanup();
        return;
      }
      signal.addEventListener("abort", cleanup, { once: true });

      nodeStream.on("data", (chunk: string | Buffer) => {
        try {
          const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
        } catch {
          // controller 已经关闭（客户端取消请求），停止读取即可
          cleanup();
        }
      });
      nodeStream.on("end", () => {
        try {
          controller.close();
        } catch {
          // 已关闭则忽略
        }
      });
      nodeStream.on("error", err => {
        try {
          controller.error(err);
        } catch {
          // 已关闭则忽略
        }
        cleanup();
      });
    },
    cancel() {
      if (!nodeStream.destroyed) nodeStream.destroy();
    },
  });
};

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("filePath");
  if (!filePath) {
    return NextResponse.json({ error: "缺少文件名参数" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const range = req.headers.get("range");

  if (range) {
    // 形如 "bytes=0-" 或 "bytes=1024-2047"
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(filePath, { start, end });
    const webStream = toSafeWebStream(nodeStream, req.signal);

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = toSafeWebStream(nodeStream, req.signal);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
    },
  });
}
