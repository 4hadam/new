"use client"

import React from "react"
import dynamic from "next/dynamic"

// شاشة تحميل موحدة للمشغلات
const PlayerLoading = () => (
  <div className="w-full h-full bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
  </div>
)

// استيراد المشغلات ديناميكياً
const VideoPlayer = dynamic(() => import("./video-player"), {
  loading: () => <PlayerLoading />,
  ssr: false
})

const VideoJsPlayer = dynamic(() => import("./videojs-player"), {
  loading: () => <PlayerLoading />,
  ssr: false
})

interface CountryDetailProps {
  country: string | null
  channel: string
  streamUrlProp: string | null
  isMobile?: boolean
  activeCategory: string | null
  onBack?: () => void 
}

// 🔍 دالة مساعدة للتحقق من يوتيوب
function isYouTubeUrl(url: string): boolean {
  if (!url) return false
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube-nocookie.com")
}

export default function CountryDetail({
  streamUrlProp,
  isMobile = false,
}: CountryDetailProps) {

  if (!streamUrlProp) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-red-500">Error: No stream URL provided.</p>
      </div>
    )
  }

  const isYoutube = isYouTubeUrl(streamUrlProp)
  const isLive = !isYoutube 

  // 👈🔴 --- هذا هو الإصلاح ---
  // لقد أعدنا العرض النسبي (w-[90%]) والحد الأقصى للعرض (max-w-6xl)
  // وحذفنا (h-full) ليأخذ حجمه من (aspect-video)
  return (
    <div className={
      isMobile
        ? "relative w-full aspect-video bg-black" // 👈 (في الهاتف: يملأ العرض)
        : "relative w-[90%] sm:w-[85%] lg:w-[82%] max-w-6xl aspect-video rounded-lg overflow-hidden shadow-2xl bg-black" // 👈 (في سطح المكتب: عائم)
    }>
      {isYoutube ? (
        <VideoPlayer
          src={streamUrlProp}
          isMobile={isMobile}
          autoPlay={true}
          muted={false} 
        />
      ) : (
        <VideoJsPlayer
          src={streamUrlProp}
          isLive={isLive}
          isMobile={isMobile}
          autoPlay={true}
          muted={false}
        />
      )}
    </div>
  )
}