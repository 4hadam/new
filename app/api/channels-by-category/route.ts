import { NextResponse } from 'next/server'
// 🔴 (1) استيراد بيانات القنوات بالكامل
import { channelsByCountry, type IPTVChannel, normalizeYouTubeUrl } from '@/lib/iptv-channels'

// 🔴 (2) دالة الفلترة الذكية (نضعها هنا في السيرفر)
function filterChannel(channel: IPTVChannel, category: string | null): boolean {
  if (!category || category === "all-channels" || category === "about" || category.startsWith("faq") || category.startsWith("privacy") || category.startsWith("feedback")) {
    return true
  }
  if (category === "random-channel") {
    return true
  }
  const lowerCategory = category.toLowerCase().replace("-", " ")
  const chName = channel.name.toLowerCase()
  const chCategory = channel.category?.toLowerCase()

  if (chCategory === lowerCategory) return true
  if (chName.includes(lowerCategory)) return true
  if ((lowerCategory === 'top news' || lowerCategory === 'news') && chCategory === 'news') return true
  if (lowerCategory === 'movies' && chCategory === 'movies') return true
  if (lowerCategory === 'music' && chCategory === 'music') return true
  if ((lowerCategory === 'kids' || lowerCategory === 'animation') && (chCategory === 'kids' || chCategory === 'animation')) return true
  if (lowerCategory === 'sports' && chCategory === 'sports') return true

  return false
}

// --------------------- API Handler ---------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') // 👈 (3) جلب الفئة من الرابط (مثل ?category=music)

    if (!category || category === "all-channels" || category === "about" || category.startsWith("faq") || category.startsWith("privacy") || category.startsWith("feedback")) {
      return NextResponse.json({ channels: [] }) // 👈 (4) لا نرجع شيء إذا كانت فئة عامة
    }

    // 5. تجميع كل القنوات من كل الدول
    let allChannels: IPTVChannel[] = []
    for (const country in channelsByCountry) {
      channelsByCountry[country].forEach(channel => {
        allChannels.push({
          ...channel,
          countryName: country, // 👈 (6) إضافة اسم الدولة للقناة
        })
      })
    }
    
    const normalizedChannels = allChannels.map((ch) => ({
      ...ch,
      url: normalizeYouTubeUrl(ch.url),
    }))

    // 7. الفلترة في السيرفر (سريع جداً)
    const filtered = normalizedChannels.filter(ch => filterChannel(ch, category))

    // 8. معالجة الحالة العشوائية
    if (category === "random-channel") {
      const randomChannels = filtered.sort(() => 0.5 - Math.random()).slice(0, 40)
      return NextResponse.json({ channels: randomChannels })
    }

    // 9. إرجاع القنوات المفلترة
    return NextResponse.json({ channels: filtered })

  } catch (error) {
    console.error("Error fetching channels by category:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}