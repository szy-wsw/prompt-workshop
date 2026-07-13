import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./useTheme";
import "./globals.css"
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "AI Prompt管理工坊",
  description: "5套马卡龙多主题提示词管理系统",
};
export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} style={{ margin: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}