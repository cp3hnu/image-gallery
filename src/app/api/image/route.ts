import fs from "fs";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("filePath");
  if (!filePath) {
    return NextResponse.json({ error: "缺少文件名参数" }, { status: 400 });
  }

  // 计算文件路径
  //const filePath = path.join(BASE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  // 读取文件流并返回
  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: { "Content-Type": "image/jpeg" },
  });
}
