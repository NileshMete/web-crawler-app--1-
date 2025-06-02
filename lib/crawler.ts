import * as cheerio from "cheerio"
import { storePage } from "./storage"

interface CrawledPage {
  id: string
  url: string
  title: string
  content: string
  status: "pending" | "crawling" | "completed" | "error"
  crawledAt?: string
  error?: string
  summary?: string
  wordCount?: number
}

interface CrawlProgress {
  total: number
  completed: number
  current: string
}

type ProgressCallback = (data: any) => void

export async function crawlWebsite(startUrl: string, onProgress: ProgressCallback) {
  console.log("Starting crawl for:", startUrl)

  try {
    const discoveredUrls = await discoverUrls(startUrl)
    console.log("Discovered URLs:", discoveredUrls)

    if (discoveredUrls.length === 0) {
      throw new Error("No URLs discovered. Please check if the website is accessible.")
    }

    let completedPages = 0
    const totalPages = discoveredUrls.length

    onProgress({
      type: "progress",
      progress: { total: totalPages, completed: 0, current: startUrl },
    })

    for (const url of discoveredUrls) {
      console.log(`Crawling ${completedPages + 1}/${totalPages}: ${url}`)

      onProgress({
        type: "progress",
        progress: { total: totalPages, completed: completedPages, current: url },
      })

      try {
        const page = await crawlSinglePage(url)
        console.log("Successfully crawled:", url)
        onProgress({ type: "page", page })
        completedPages++
      } catch (error) {
        console.error(`Error crawling ${url}:`, error)
        const errorPage: CrawledPage = {
          id: generateId(),
          url,
          title: "Error",
          content: "",
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          crawledAt: new Date().toISOString(),
          wordCount: 0,
        }

        await storePage(errorPage)
        onProgress({ type: "page", page: errorPage })
        completedPages++
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    onProgress({
      type: "complete",
      totalPages: completedPages,
    })

    console.log("Crawling completed successfully")
  } catch (error) {
    console.error("Crawling failed:", error)
    onProgress({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function discoverUrls(startUrl: string): Promise<string[]> {
  const visitedUrls = new Set<string>()
  const urlsToVisit: string[] = [startUrl]
  const discoveredUrls: string[] = []
  const baseUrl = new URL(startUrl)
  const baseDomain = baseUrl.hostname

  console.log("Starting URL discovery for domain:", baseDomain)

  // Check if this is a known problematic domain
  const blockedDomains = ["google.com", "facebook.com", "twitter.com", "instagram.com", "linkedin.com"]
  if (blockedDomains.some((domain) => baseDomain.includes(domain))) {
    throw new Error(
      `The domain ${baseDomain} typically blocks automated crawling. Please try a different website like example.com, wikipedia.org, or your own website.`,
    )
  }

  while (urlsToVisit.length > 0 && discoveredUrls.length < 50) {
    const currentUrl = urlsToVisit.shift()!

    if (visitedUrls.has(currentUrl)) continue
    visitedUrls.add(currentUrl)
    discoveredUrls.push(currentUrl)

    console.log(`Discovering URLs from: ${currentUrl}`)

    try {
      const response = await fetchWithRetry(currentUrl, 2)

      if (!response.ok) {
        console.log(`Failed to fetch ${currentUrl}: ${response.status}`)
        continue
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const links: string[] = []
      $("a[href]").each((_, element) => {
        const href = $(element).attr("href")
        if (!href) return

        try {
          let absoluteUrl: string

          if (href.startsWith("http")) {
            absoluteUrl = href
          } else if (href.startsWith("//")) {
            absoluteUrl = baseUrl.protocol + href
          } else if (href.startsWith("/")) {
            absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`
          } else {
            absoluteUrl = new URL(href, currentUrl).toString()
          }

          const urlObj = new URL(absoluteUrl)

          if (
            urlObj.hostname === baseDomain &&
            !visitedUrls.has(absoluteUrl) &&
            !urlsToVisit.includes(absoluteUrl) &&
            !absoluteUrl.includes("#") &&
            !absoluteUrl.match(/\.(pdf|jpg|jpeg|png|gif|zip|exe|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov)$/i) &&
            !absoluteUrl.includes("mailto:") &&
            !absoluteUrl.includes("tel:")
          ) {
            links.push(absoluteUrl)
          }
        } catch (e) {
          // Invalid URL, skip
        }
      })

      console.log(`Found ${links.length} valid links on ${currentUrl}`)
      urlsToVisit.push(...links.slice(0, 10)) // Limit to prevent too many URLs
    } catch (error) {
      console.error(`Error discovering URLs from ${currentUrl}:`, error)
      // Continue with other URLs even if one fails
    }
  }

  console.log(`Total discovered URLs: ${discoveredUrls.length}`)
  return discoveredUrls
}

export async function crawlSinglePage(url: string): Promise<CrawledPage> {
  const pageId = generateId()

  console.log("Crawling single page:", url)

  try {
    // Try multiple fetch strategies
    const response = await fetchWithRetry(url, 3)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let title = $("title").text().trim()
    if (!title) title = $("h1").first().text().trim()
    if (!title) title = $("meta[property='og:title']").attr("content") || ""
    if (!title) title = $("meta[name='title']").attr("content") || ""
    if (!title) title = "Untitled Page"

    const content = extractMainContent($)
    const summary = generateSummary(content)
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length

    const completedPage: CrawledPage = {
      id: pageId,
      url,
      title: title.substring(0, 200),
      content,
      summary,
      wordCount,
      status: "completed",
      crawledAt: new Date().toISOString(),
    }

    await storePage(completedPage)
    console.log("Successfully processed page:", url)
    return completedPage
  } catch (error) {
    console.error("Error crawling page:", url, error)
    const errorPage: CrawledPage = {
      id: pageId,
      url,
      title: "Error",
      content: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      crawledAt: new Date().toISOString(),
      wordCount: 0,
    }

    await storePage(errorPage)
    return errorPage
  }
}

// Add this new function for better fetch handling
async function fetchWithRetry(url: string, maxRetries: number): Promise<Response> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    DNT: "1",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries} for ${url}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: "follow",
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      console.error(`Fetch attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        // If this is a blocked site, provide a helpful error message
        if (url.includes("google.com") || url.includes("facebook.com") || url.includes("twitter.com")) {
          throw new Error(
            `This website (${new URL(url).hostname}) blocks automated crawling. Try a different website like example.com, wikipedia.org, or your own website.`,
          )
        }
        throw error
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw new Error("Max retries exceeded")
}

function extractMainContent($: cheerio.CheerioAPI): string {
  $(
    "script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .nav, .header, .footer, .ads, .advertisement, .social, .share, .comments, .comment",
  ).remove()

  const contentSelectors = [
    "main",
    "article",
    ".main-content",
    ".content",
    ".post-content",
    ".entry-content",
    ".page-content",
    "#content",
    "#main",
    ".container .row",
    ".container",
    "body",
  ]

  let content = ""

  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0) {
      content = element.text().trim()
      if (content.length > 100) {
        break
      }
    }
  }

  if (!content || content.length < 100) {
    content = $("body").text().trim()
  }

  content = content
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .replace(/\t/g, " ")
    .trim()

  content = content
    .replace(/Skip to main content/gi, "")
    .replace(/Skip to content/gi, "")
    .replace(/Menu/gi, "")
    .replace(/Search/gi, "")

  return content.substring(0, 15000)
}

function generateSummary(content: string): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20)
  const summary = sentences.slice(0, 3).join(". ").trim()
  return summary.length > 300 ? summary.substring(0, 300) + "..." : summary + "."
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
