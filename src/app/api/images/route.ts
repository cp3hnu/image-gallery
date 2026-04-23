import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { ImageInfo } from "@/app/types";

const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp)$/i;
const VIDEO_REGEX = /\.(mp4|webm|mov|m4v|mkv|avi|ogv)$/i;

type Entry = {
  filePath: string;
  fileName: string;
};

const collectFiles = async (dir: string, images: Entry[], videos: Map<string, string>): Promise<void> => {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await collectFiles(filePath, images, videos);
      continue;
    }

    if (IMAGE_REGEX.test(file.name)) {
      images.push({ filePath, fileName: file.name });
    } else if (VIDEO_REGEX.test(file.name)) {
      const base = path.basename(file.name, path.extname(file.name)).toLowerCase();
      // 同名视频若有多份，保留第一个遇到的
      const key = path.join(dir, base);
      if (!videos.has(key)) {
        videos.set(key, filePath);
      }
    }
  }
};

const getImages = async (dir: string): Promise<ImageInfo[]> => {
  const images: Entry[] = [];
  const videos = new Map<string, string>();
  await collectFiles(dir, images, videos);

  return images.map(({ filePath, fileName }) => {
    const base = path.basename(fileName, path.extname(fileName)).toLowerCase();
    const videoKey = path.join(path.dirname(filePath), base);
    const videoPath = videos.get(videoKey);

    const info: ImageInfo = {
      src: `/api/image?filePath=${encodeURIComponent(filePath)}`,
      name: fileName,
    };
    if (videoPath) {
      info.video = `/api/video?filePath=${encodeURIComponent(videoPath)}`;
    }
    return info;
  });
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
