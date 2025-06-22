"use client";

import "@/app/globals.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [directory, setDirectory] = useState("");

  useEffect(() => {
    const dir = localStorage.getItem("directory") || "";
    setDirectory(dir);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    const directory = formData.get("directory")?.toString().trim() || "";
    // 验证目录是否为空
    if (!directory) {
      alert("目录不能为空");
      return;
    }
    localStorage.setItem("directory", directory);
    router.push("/images");
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <form className="space-y-6" action={handleSubmit}>
          <div>
            <input
              type="text"
              id="directory"
              name="directory"
              required
              className="input-base"
              placeholder="请输入目录"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <button type="submit" className="primary-button">
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
