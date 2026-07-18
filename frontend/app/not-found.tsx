'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">页面未找到</h1>
        <p className="text-gray-500 mb-8">抱歉，您访问的页面不存在</p>
        <Link href="/" className="px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  )
}
