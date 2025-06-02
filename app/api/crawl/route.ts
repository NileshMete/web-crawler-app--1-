import type { NextRequest } from "next/server"
import { crawlWebsite } from "@/lib/crawler"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return new Response("URL is required", { status: 400 })
    }

    // Validate and normalize URL
    let normalizedUrl: string
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
      normalizedUrl = urlObj.toString()
    } catch {
      return new Response("Invalid URL format", { status: 400 })
    }

    console.log("Starting crawl for:", normalizedUrl)

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()

        crawlWebsite(normalizedUrl, (data) => {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            console.error("Error encoding SSE data:", error)
          }
        })
          .then(() => {
            console.log("Crawling completed successfully")
            controller.close()
          })
          .catch((error) => {
            console.error("Crawling error:", error)
            const errorMessage = `data: ${JSON.stringify({
              type: "error",
              error: error.message || "Unknown crawling error",
            })}\n\n`
            controller.enqueue(encoder.encode(errorMessage))
            controller.close()
          })
      },
      cancel() {
        console.log("Stream cancelled")
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
