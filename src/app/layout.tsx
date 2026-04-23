import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "影片预览",
  description: "影片预览 & 家庭影院",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
    date: false,
    url: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
