"use client";

import Image from "next/image";
import { ImageInfo } from "@/app/types";
import { useEffect, useState } from "react";

export default function Images() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    const directory = localStorage.getItem("directory") || "";
    fetch("/api/images?directory=" + directory, {
      method: "GET",
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
            images: [],
          };
        }
        return res.json();
      })
      .then(data => setImages(data.images))
      .catch(err => console.error("获取图片失败", err));
  }, []);

  useEffect(() => {
    if (!playingVideo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlayingVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingVideo]);

  const preview = (filename: string) => {
    const name = filename.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX}${encodedName}`;
    window.open(url, "_blank");
  };

  const watch = (image: ImageInfo) => {
    if (image.video) {
      setPlayingVideo(image.video);
      return;
    }
    const name = image.name.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX2}${encodedName}/?lang=zh`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-3 gap-4 p-4">
        {images.map(image => {
          const { src, name, video } = image;
          return (
            <div key={src}>
              <div className="relative">
                <Image
                  width={800}
                  height={800}
                  src={src}
                  alt="图片"
                  className="w-full h-auto rounded-lg shadow cursor-pointer"
                  onClick={() => watch(image)}
                />
                {video && (
                  <span className="absolute bottom-0 right-0 bg-black/60 text-white text-xs xl:text-2xl px-2 py-1 rounded-br pointer-events-none">
                    本地
                  </span>
                )}
              </div>
              <div className="mt-4 text-lg cursor-pointer w-fit break-all" onClick={() => preview(name)}>
                {name}
              </div>
            </div>
          );
        })}
      </div>
      {error && <div className="w-full h-full flex items-center justify-center text-red-500 text-4xl">{error}</div>}
      {playingVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPlayingVideo(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="关闭"
              className="absolute -top-10 right-0 text-white text-4xl leading-none px-3 py-1 hover:opacity-80"
              onClick={() => setPlayingVideo(null)}>
              ×
            </button>
            <video
              src={playingVideo}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
