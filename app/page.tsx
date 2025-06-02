"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Search, Trash2, ExternalLink, FileText, Download, Eye, Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Footer } from "@/components/footer"
import Link from "next/link"

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

export default function WebCrawlerApp() {
  const [url, setUrl] = useState("")
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([])
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState<CrawlProgress>({ total: 0, completed: 0, current: "" })

  const startCrawl = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    // Suggest alternative sites for known problematic domains
    const problematicDomains = ["google.com", "facebook.com", "twitter.com", "instagram.com"]
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname

    if (problematicDomains.some((blocked) => domain.includes(blocked))) {
      toast({
        title: "⚠️ Website May Block Crawling",
        description:
          "This website typically blocks automated crawling. Try example.com, wikipedia.org, or your own website instead.",
        variant: "destructive",
      })
    }

    setIsCrawling(true)
    setCrawledPages([])
    setProgress({ total: 0, completed: 0, current: url })

    try {
      console.log("Starting crawl for:", url)

      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === "progress") {
                  setProgress(data.progress)
                } else if (data.type === "page") {
                  setCrawledPages((prev) => {
                    const existing = prev.find((p) => p.id === data.page.id)
                    if (existing) {
                      return prev.map((p) => (p.id === data.page.id ? data.page : p))
                    }
                    return [...prev, data.page]
                  })
                } else if (data.type === "complete") {
                  setIsCrawling(false)
                  toast({
                    title: "🎉 Crawling Complete!",
                    description: `Successfully processed ${data.totalPages} pages`,
                  })
                } else if (data.type === "error") {
                  setIsCrawling(false)
                  toast({
                    title: "Crawling Error",
                    description: data.error,
                    variant: "destructive",
                  })
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Crawling error:", error)
      setIsCrawling(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to crawl the website",
        variant: "destructive",
      })
    }
  }

  const deletePage = async (pageId: string) => {
    try {
      await fetch(`/api/pages/${pageId}`, { method: "DELETE" })
      setCrawledPages((prev) => prev.filter((p) => p.id !== pageId))
      toast({
        title: "Success",
        description: "Page deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      })
    }
  }

  const exportToPDF = async (pageId: string) => {
    try {
      const response = await fetch(`/api/export/pdf/${pageId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `page-${pageId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "Success",
          description: "PDF exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500"
      case "crawling":
        return "bg-blue-500 animate-pulse"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const completedPages = crawledPages.filter((p) => p.status === "completed").length
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-6 py-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Globe className="h-12 w-12 text-blue-400 animate-float" />
                <div className="absolute inset-0 h-12 w-12 text-blue-400 animate-pulse-glow rounded-full"></div>
              </div>
              <h1 className="text-5xl font-bold gradient-text">Smart Web Crawler</h1>
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Extract and analyze website content with intelligent crawling technology. Perfect for RAG-based AI
              chatbots and content analysis.
            </p>
          </div>

          {/* URL Input Card */}
          <Card className="glass-effect border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-white">
                <Search className="h-6 w-6 text-blue-400" />
                Start Your Crawling Journey
              </CardTitle>
              <CardDescription className="text-gray-300">
                Enter any website URL to automatically discover and crawl all subpages with AI-powered content
                extraction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isCrawling}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400"
                />
                <Button
                  onClick={startCrawl}
                  disabled={isCrawling || !url.trim()}
                  className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  {isCrawling ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Start Crawl
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-medium">💡 Suggested websites to try:</p>
                <div className="flex flex-wrap gap-2">
                  {["https://example.com", "https://httpbin.org", "https://jsonplaceholder.typicode.com"].map(
                    (suggestedUrl) => (
                      <button
                        key={suggestedUrl}
                        onClick={() => setUrl(suggestedUrl)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs transition-colors"
                        disabled={isCrawling}
                      >
                        {suggestedUrl.replace("https://", "")}
                      </button>
                    ),
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  ⚠️ Note: Some websites (Google, Facebook, Twitter) block automated crawling
                </p>
              </div>

              {/* Enhanced Progress */}
              {isCrawling && (
                <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span className="flex items-center gap-2">
                      <LoadingSpinner className="h-4 w-4" />
                      Progress: {progress.completed} / {progress.total} pages
                    </span>
                    <span className="font-semibold text-blue-400">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full h-3" />
                  <p className="text-sm text-gray-400 truncate">
                    🔍 Currently crawling: <span className="text-blue-400">{progress.current}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Stats */}
          {crawledPages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="glass-effect border-white/20 hover:border-blue-400/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{crawledPages.length}</div>
                  <div className="text-sm text-gray-300">Total Pages</div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 hover:border-emerald-400/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{completedPages}</div>
                  <div className="text-sm text-gray-300">Completed</div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 hover:border-red-400/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {crawledPages.filter((p) => p.status === "error").length}
                  </div>
                  <div className="text-sm text-gray-300">Errors</div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-white/20 hover:border-orange-400/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">
                    {crawledPages.filter((p) => p.status === "crawling").length}
                  </div>
                  <div className="text-sm text-gray-300">In Progress</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Dashboard */}
          {crawledPages.length > 0 && (
            <Card className="glass-effect border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-6 w-6 text-purple-400" />
                  Discovered Pages Dashboard
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Manage, view, and export all discovered pages with advanced filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-white/10 border border-white/20">
                    <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      All ({crawledPages.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      Completed ({completedPages})
                    </TabsTrigger>
                    <TabsTrigger
                      value="error"
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                    >
                      Errors ({crawledPages.filter((p) => p.status === "error").length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="crawling"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      In Progress ({crawledPages.filter((p) => p.status === "crawling").length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-6">
                    <PagesList
                      pages={crawledPages}
                      onDelete={deletePage}
                      onExportPDF={exportToPDF}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4 mt-6">
                    <PagesList
                      pages={crawledPages.filter((p) => p.status === "completed")}
                      onDelete={deletePage}
                      onExportPDF={exportToPDF}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>

                  <TabsContent value="error" className="space-y-4 mt-6">
                    <PagesList
                      pages={crawledPages.filter((p) => p.status === "error")}
                      onDelete={deletePage}
                      onExportPDF={exportToPDF}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>

                  <TabsContent value="crawling" className="space-y-4 mt-6">
                    <PagesList
                      pages={crawledPages.filter((p) => p.status === "crawling")}
                      onDelete={deletePage}
                      onExportPDF={exportToPDF}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

interface PagesListProps {
  pages: CrawledPage[]
  onDelete: (id: string) => void
  onExportPDF: (id: string) => void
  getStatusColor: (status: string) => string
}

function PagesList({ pages, onDelete, onExportPDF, getStatusColor }: PagesListProps) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No pages found in this category</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pages.map((page) => (
        <Card
          key={page.id}
          className="glass-effect border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={`${getStatusColor(page.status)} text-white px-3 py-1`}>{page.status}</Badge>
                  <h3 className="font-semibold text-white text-lg truncate">{page.title || "Untitled Page"}</h3>
                  {page.wordCount && (
                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">{page.wordCount} words</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 truncate transition-colors"
                  >
                    {page.url}
                  </a>
                </div>

                {page.summary && <p className="text-sm text-gray-300 mb-3 line-clamp-2">{page.summary}</p>}

                {page.error && (
                  <p className="text-sm text-red-400 mb-3 bg-red-500/10 p-2 rounded border border-red-500/20">
                    ⚠️ Error: {page.error}
                  </p>
                )}

                {page.crawledAt && (
                  <p className="text-xs text-gray-500">🕒 Crawled: {new Date(page.crawledAt).toLocaleString()}</p>
                )}
              </div>

              <div className="flex gap-2">
                {page.status === "completed" && (
                  <>
                    <Link href={`/page/${page.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExportPDF(page.id)}
                      className="bg-white/10 border-white/20 text-white hover:bg-emerald-500/20 hover:border-emerald-400"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(page.id)}
                  disabled={page.status === "crawling"}
                  className="bg-white/10 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
