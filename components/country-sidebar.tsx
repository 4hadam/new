"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual" 

// 👈 (1) استيراد الهوك الجديد
import { useChannelsManagement } from "@/hooks/useChannelsManagement" 

// 👈 (2) تم حذف getChannelsByCountry/Category (لم نعد بحاجة لها هنا)
import { 
  getHistoryChannels, 
  getFavoriteChannels, 
  IPTVChannel 
} from "../lib/iptv-channels"
import { COUNTRY_CODE_MAP } from "../lib/country-codes"
import { COUNTRY_LANG_MAP } from "../lib/country-lang-map" 

interface CountrySidebarProps {
  selectedCountry: string | null
  onSelectCountry: (country: string | null) => void
  onSelectChannel: (channel: IPTVChannel) => void 
  onClose?: () => void
  externalSearch?: string
  currentTime: string
  isMobile?: boolean
  activeCategory: string | null
  activeChannel: IPTVChannel | null
}

// --------------------- الدوال المساعدة (تبقى كما هي) ---------------------
function isYouTubeUrlString(url?: string): boolean {
  if (!url) return false
  try {
    const s = url.toString().toLowerCase()
    return s.includes("youtube.com") || s.includes("youtu.be") || s.includes("youtube-nocookie.com")
  } catch { return false }
}
function isYouTubeChannel(channel: any): boolean {
  if (!channel) return false
  if (typeof channel.url === "string" && isYouTubeUrlString(channel.url)) return true
  const pf = (channel.platform || channel.source || "").toString().toLowerCase()
  if (pf.includes("youtube")) return true
  return false
}
function detectChannelLang(channel: any, countryFallback?: string | null): string | null {
  if (!channel) return null
  const validLangs = new Set(["ar","en","fr","es","pt","tr","ur","he","de","ru","zh","it","nl","pl","sv","no","fi","da","hi","bn","sw"])
  const candidates = [channel.language, channel.lang]
  for (const c of candidates) {
    if (!c) continue
    const val = String(Array.isArray(c) ? c[0] : c).toLowerCase().trim()
    if (validLangs.has(val)) return val
  }
  const text = JSON.stringify(channel).toLowerCase()
  if (text.match(/[\u0600-\u06FF]/)) return "ar" 
  if (countryFallback) {
    const fallback = COUNTRY_LANG_MAP[countryFallback]
    if (fallback && validLangs.has(fallback)) return fallback
  }
  return null
}
// --------------------- (نهاية الدوال المساعدة) ---------------------


const COUNTRIES = Object.keys(COUNTRY_CODE_MAP)

export default function CountrySidebar({
  selectedCountry,
  onSelectCountry,
  onSelectChannel,
  onClose,
  externalSearch = "",
  currentTime,
  isMobile = false,
  activeCategory,
  activeChannel,
}: CountrySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const parentRef = useRef<HTMLDivElement>(null)
  
  // 👈 (3) تم حذف 'useState' لـ 'channels' و 'loading'
  
  // 👈 (4) حالة خاصة للسجل والمفضلة (لأنها لا تحتاج تحميل تدريجي)
  const [specialChannels, setSpecialChannels] = useState<IPTVChannel[]>([])
  const [specialLoading, setSpecialLoading] = useState(false)

  const isCategoryBrowsing = activeCategory !== "all-channels" && activeCategory !== "about" && !activeCategory?.startsWith("faq") && !activeCategory?.startsWith("privacy") && !activeCategory?.startsWith("feedback")
  const isHistoryOrFavorites = activeCategory === "history" || activeCategory === "favorites"
  
  // 👈 (5) استخدام الهوك الجديد (فقط إذا لم يكن سجلاً أو مفضلة)
  const {
    channels: paginatedChannels,
    loading: paginatedLoading,
    loadingMore,
    hasMore,
    loadMoreChannels
  } = useChannelsManagement({
    country: selectedCountry,
    category: activeCategory,
    pageSize: 50, // 👈 تحميل 50 قناة في كل مرة
    enableAutoLoad: !isHistoryOrFavorites // 👈 تفعيل التحميل التلقائي
  })

  useEffect(() => setSearchQuery(externalSearch), [externalSearch])

  const shouldShowChannels = !!selectedCountry || isCategoryBrowsing || isHistoryOrFavorites

  // 👈 (6) useEffect محدث لجلب السجل والمفضلة
  useEffect(() => {
    const fetchSpecialChannels = async () => {
      setSpecialLoading(true)
      setSpecialChannels([])
      try {
        let data: IPTVChannel[] = []
        if (activeCategory === "history") {
          data = await getHistoryChannels();
        } else if (activeCategory === "favorites") {
          data = await getFavoriteChannels();
        }
        setSpecialChannels(data)
      } catch (err) { 
        console.error(err); 
        setSpecialChannels([]) 
      }
      finally { setSpecialLoading(false) }
    }

    if (isHistoryOrFavorites) {
      fetchSpecialChannels()
    } else {
      setSpecialChannels([])
      setSpecialLoading(false)
    }
  }, [activeCategory, isHistoryOrFavorites])

  // 👈 (7) تحديد أي قنوات يجب عرضها (عادية أم خاصة)
  const channels = isHistoryOrFavorites ? specialChannels : paginatedChannels
  const loading = isHistoryOrFavorites ? specialLoading : paginatedLoading
  
  // (باقي الدوال ... تبقى كما هي)
  const handleSelectCountry = (country: string) => onSelectCountry(country)
  const handleBack = () => onSelectCountry(null)
  const saveToHistory = (channel: IPTVChannel) => {
    if (typeof window === 'undefined') return;
    try {
      const channelToSave: IPTVChannel = { name: channel.name, url: channel.url, countryName: channel.countryName || selectedCountry, category: channel.category };
      let history: IPTVChannel[] = JSON.parse(localStorage.getItem('sora_tv_history') || '[]');
      history = history.filter(c => !(c.name === channelToSave.name && c.countryName === channelToSave.countryName));
      history.unshift(channelToSave);
      history = history.slice(0, 20); 
      localStorage.setItem('sora_tv_history', JSON.stringify(history));
    } catch (e) { console.error("Failed to save history:", e); }
  }
  const handleSelectChannel = (channel: IPTVChannel) => {
    saveToHistory(channel);
    onSelectChannel(channel) 
    if (!isMobile) onClose?.()
  }
  const getCode = (countryName: string) => COUNTRY_CODE_MAP[countryName as keyof typeof COUNTRY_CODE_MAP]?.toLowerCase() || "xx"
  
  let title = "Select a Country"
  if (selectedCountry) title = selectedCountry;
  else if (shouldShowChannels && activeCategory) {
    if (activeCategory === 'history') title = "History";
    else if (activeCategory === 'favorites') title = "Favorites";
    else title = activeCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const YouTubeSVG = (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="3" fill="#FF0000" />
      <path d="M10 15V9l6 3-6 3z" fill="#FFFFFF" />
    </svg>
  )
  
  // 👈 (8) تصفية القنوات بناءً على البحث (هذا يحدث في الواجهة)
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 👈 (9) تحديث Virtualizer ليدعم التحميل التدريجي
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? filteredChannels.length + 1 : filteredChannels.length, // +1 لإظهار مؤشر التحميل
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // ارتفاع كل عنصر
    overscan: 10,
  })

  // 👈 (10) useEffect جديد للتحميل التلقائي عند الوصول للنهاية
  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems()
    if (virtualItems.length === 0) return

    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return
    
    // إذا كان آخر عنصر معروض هو العنصر قبل الأخير، قم بتحميل المزيد
    if (
      lastItem.index >= filteredChannels.length - 5 &&
      hasMore &&
      !loadingMore
    ) {
      loadMoreChannels()
    }
  }, [
    rowVirtualizer.getVirtualItems(), 
    filteredChannels.length, 
    hasMore, 
    loadingMore, 
    loadMoreChannels
  ])

  return (
    <aside className="w-full h-full text-white flex flex-col bg-[#0B0D11]">
      <div className="border-b border-white/10" />

      {/* --- الهيدر --- */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {shouldShowChannels && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full bg-black text-white transition-transform duration-200"
              aria-label="Return to list"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
          <h2 className="text-lg font-semibold text-white leading-tight">
            {title}
          </h2>
        </div>
        <p className="text-sm text-slate-400">{currentTime}</p>
      </div>

      <div className="border-b border-white/10" />

      {/* --- حاوية التمرير الرئيسية --- */}
      <div ref={parentRef} className="flex-1 overflow-y-auto custom-scroll">
        {!shouldShowChannels ? (
          // --- (أ) عرض قائمة الدول (تبقى كما هي) ---
          <ul>
            {COUNTRIES.map((country) => (
              <li key={country} className="sidebar-entry country-item" style={{ height: 64 }}>
                <button
                  onClick={() => handleSelectCountry(country)}
                  className="flex items-center gap-2 w-full h-full px-4 hover:bg-white/5 transition-colors text-left"
                >
                  <img
                    src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCode(country)}.svg`}
                    alt={`${country} flag`}
                    className="w-5 h-4 rounded-sm object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                  <span className="text-[15px] font-medium text-white truncate">{country}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // --- (ب) عرض قائمة القنوات (مُحدثة) ---
          <>
            {loading && filteredChannels.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                Loading channels...
              </div>
            ) : filteredChannels.length > 0 ? (
              
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  
                  // 👈 (11) التحقق إذا كان هذا هو عنصر "التحميل"
                  const isLoaderRow = virtualItem.index >= filteredChannels.length
                  
                  if (isLoaderRow) {
                    return (
                      <div
                        key="loading-more"
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="flex items-center justify-center px-4"
                      >
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                        <span className="ml-2 text-slate-400 text-sm">Loading more...</span>
                      </div>
                    )
                  }

                  // إذا لم يكن عنصر تحميل، اعرض القناة
                  const channel = filteredChannels[virtualItem.index]
                  if (!channel) return null // أمان إضافي
                  
                  const isYT = isYouTubeChannel(channel)
                  const countryName = selectedCountry || channel.countryName || ""
                  const lang = detectChannelLang(channel, countryName) || ""
                  const flagCode = getCode(countryName)
                  const isActive = activeChannel && activeChannel.url === channel.url

                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="sidebar-entry channel-item"
                    >
                      <button
                        onClick={() => handleSelectChannel(channel)}
                        className={`flex items-center justify-between w-full h-full px-5 transition-colors text-left ${
                          isActive
                            ? "bg-gray-700/80 text-white shadow-inner"
                            : "text-white hover:bg-white/5"
                        }`}
                        title={channel.name}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${flagCode}.svg`}
                            alt="flag"
                            className="w-6 h-4 rounded-sm object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                          <span className="text-[15px] text-white truncate font-normal">
                            {channel.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 ml-3 min-w-[92px] justify-end">
                          {isYT ? (
                            <span title="YouTube stream">{YouTubeSVG}</span>
                          ) : (
                            <span style={{ width: 24, display: "inline-block" }} />
                          )}
                          <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                            {lang}
                          </span>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                {searchQuery ? 
                  `No channels found for "${searchQuery}"` : 
                  `No channels found for "${activeCategory}" ${selectedCountry ? `in ${selectedCountry}` : ''}.`
                }
              </div>
            )}
            
            {/* 👈 (12) زر تحميل يدوي (احتياطي) */}
            {hasMore && !loadingMore && !isHistoryOrFavorites && (
              <div className="px-4 py-3 border-t border-white/10">
                <button
                  onClick={loadMoreChannels}
                  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors"
                >
                  Load More Channels
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}