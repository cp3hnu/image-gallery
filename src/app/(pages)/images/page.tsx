"use client";

import Image from "next/image";
import { ImageInfo } from "@/app/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Images() {
  const router = useRouter();
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playingImage, setPlayingImage] = useState<ImageInfo | null>(null);
  const [keyword, setKeyword] = useState("");
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);

  const filteredImages = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return images.filter(image => {
      if (onlyWithVideo && !image.video) return false;
      if (kw && !image.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [images, keyword, onlyWithVideo]);

  useEffect(() => {
    const directory = localStorage.getItem("directory");
    if (!directory) {
      router.replace("/");
      return;
    }
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
  }, [router]);

  useEffect(() => {
    if (!playingImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlayingImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playingImage]);

  const preview = (filename: string) => {
    const name = filename.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX}${encodedName}`;
    window.open(url, "_blank");
  };

  const watch = (image: ImageInfo) => {
    if (image.video) {
      setPlayingImage(image);
      return;
    }
    const name = image.name.replace(/\.[^/.]+$/, ""); // 去掉扩展名
    const encodedName = encodeURIComponent(name.toLowerCase());
    const url = `${process.env.NEXT_PUBLIC_LINK_PREFIX2}${encodedName}/?lang=zh`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      {!error && (
        <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur p-3 sm:p-4 border-b border-gray-200">
          <div className="relative flex-1 sm:min-w-[200px]">
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="按名称搜索"
              className="w-full px-4 py-2 border border-gray-200 rounded-3xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {keyword && (
              <button
                type="button"
                aria-label="清除搜索"
                onClick={() => setKeyword("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-11.707a1 1 0 00-1.414-1.414L10 7.172 7.707 4.879a1 1 0 00-1.414 1.414L8.586 8.586 6.293 10.879a1 1 0 101.414 1.414L10 10l2.293 2.293a1 1 0 001.414-1.414L11.414 8.586l2.293-2.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center sm:justify-start gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-base whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyWithVideo}
                onChange={e => setOnlyWithVideo(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              仅显示带视频
            </label>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filteredImages.length} / {images.length}
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 p-4">
        {filteredImages.map(image => {
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
      {!error && images.length > 0 && filteredImages.length === 0 && (
        <div className="w-full text-center text-gray-500 text-xl py-10">没有符合条件的图片</div>
      )}
      {error && <div className="w-full h-full flex items-center justify-center text-red-500 text-4xl">{error}</div>}
      {playingImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPlayingImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="关闭"
              className="absolute -top-10 right-0 text-white text-4xl leading-none px-3 py-1 hover:opacity-80"
              onClick={() => setPlayingImage(null)}>
              ×
            </button>
            <video
              key={playingImage.video}
              src={playingImage.video}
              controls
              autoPlay
              crossOrigin="anonymous"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg bg-black">
              {playingImage.subtitle && (
                <track kind="subtitles" src={playingImage.subtitle} srcLang="zh" label="中文" default />
              )}
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
