"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, ExternalLink, Calendar, FileText, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Footer } from "@/components/footer"

interface CrawledPage {
  id: string
  url: string
  title: string
  content: string
  status: string
  crawledAt?: string
  wordCount?: number
  summary?: string
}

export default function PageDetailView() {
  const params = useParams()
  const router = useRouter()
  const [page, setPage] = useState<CrawledPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/pages/${params.id}`)
        if (response.ok) {
          const pageData = await response.json()
          setPage(pageData)
        } else {
          setError("Page not found")
        }
      } catch (err) {
        setError("Failed to load page")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPage()
    }
  }, [params.id])

  const exportToPDF = async () => {
    if (!page) return

    try {
      const response = await fetch(`/api/export/pdf/${page.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${page.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-12 w-12 mx-auto text-blue-400" />
          <p className="text-gray-300">Loading page content...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-white/20 max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="bg-blue-500 hover:bg-blue-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Page Header */}
          <Card className="glass-effect border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-emerald-500 text-white">{page.status}</Badge>
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl text-white mb-2">{page.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                    <ExternalLink className="h-4 w-4" />
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                    >
                      {page.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {page.crawledAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(page.crawledAt).toLocaleString()}
                      </div>
                    )}
                    {page.wordCount && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {page.wordCount.toLocaleString()} words
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary */}
          {page.summary && (
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{page.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Full Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{page.content}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}
