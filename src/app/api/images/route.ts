import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ImageInfo } from "@/app/types";

const getImages = async (dir: string): Promise<ImageInfo[]> => {
  let results: ImageInfo[] = [];
  const files = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(await getImages(filePath));
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      results.push({
        src: `/api/image?filePath=${encodeURIComponent(filePath)}`,
        name: file.name,
      });
    }
  }

  return results;
};

// 处理 GET 请求
export async function GET(req: NextRequest) {
  const directory = req.nextUrl.searchParams.get("directory") || "";
  if (!directory) {
    return NextResponse.json(
      {
        error: "缺少目录参数",
      },
      {
        status: 400,
      },
    );
  }
  if (!fs.existsSync(directory)) {
    return NextResponse.json(
      {
        error: "目录不存在",
      },
      {
        status: 404,
      },
    );
  }
  try {
    const images = await getImages(directory);
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json(
      {
        error: "无法读取目录",
      },
      {
        status: 500,
      },
    );
  }
}
