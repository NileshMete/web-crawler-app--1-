import { type NextRequest, NextResponse } from "next/server"
import { crawlSinglePage } from "@/lib/crawler"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const page = await crawlSinglePage(url)
    return NextResponse.json(page)
  } catch (error) {
    console.error("Re-crawl error:", error)
    return NextResponse.json({ error: "Failed to re-crawl page" }, { status: 500 })
  }
}
