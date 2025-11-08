import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge" // ⚡️ أسرع تنفيذ على Vercel Edge Functions

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url")
    const key = req.nextUrl.searchParams.get("key") // optional key protection

    // ✅ تحقق من وجود الرابط
    if (!url) {
      return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 })
    }

    // 🔒 حماية اختيارية بمفتاح API_KEY إن أردت
    const serverKey = process.env.API_KEY
    if (serverKey && key !== serverKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ إعداد رؤوس الطلب للبثوص (مهم لتفادي 403 أو block)
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: new URL(url).origin,
      Origin: new URL(url).origin,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    }

    // ✅ طلب المصدر الأصلي
    const response = await fetch(url, { headers })

    // ❌ إن لم يستجب السيرفر
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.statusText}` }, { status: response.status })
    }

    // ✅ تمرير الاستجابة كما هي (stream)
    const res = new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    })

    return res
  } catch (err) {
    console.error("Proxy error:", err)
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 })
  }
}
