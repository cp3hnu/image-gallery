"use client";

import Image from "next/image";
import { ImageInfo } from "@/app/types";
import { useEffect, useState } from "react";

export default function Images() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const directory = localStorage.getItem("directory") || "";
    fetch("/api/images?directory=" + directory, {
      method: "GET"
    })
      .then(res => {
        if (!res.ok) {
          const { status } = res;
          if (status === 404) {
            setError("目录不存在");
          } else if (status === 500) {
            setError("无法读取目录");
          }
          return {
            images: []
          };
        }
        return res.json();
      })
      .then(data => setImages(data.images))
      .catch(err => console.error("获取图片失败", err));
  }, []);

  const preview = (filename: string) => {
    const name = filename.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX}${encodedName}`;
    window.open(url, "_blank");
  };

  const watch = (filename: string) => {
    const name = filename.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX2}${encodedName}/?lang=zh`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-3 gap-4 p-4">
        {images.map(({ src, name }) => (
          <div key={name}>
            <Image
              width={100}
              height={100}
              src={src}
              alt="图片"
              className="w-full h-auto rounded-lg shadow"
              onClick={() => preview(name)}
            />
            <div
              className="mt-4 text-lg cursor-pointer w-fit"
              onClick={() => watch(name)}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <div className="w-full h-full flex items-center justify-center text-red-500 text-4xl">
          {error}
        </div>
      )}
    </div>
  );
}
