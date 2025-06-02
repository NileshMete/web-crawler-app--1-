// In-memory storage (will be replaced with Supabase later)
interface CrawledPage {
  id: string
  url: string
  title: string
  content: string
  status: "pending" | "crawling" | "completed" | "error"
  crawledAt?: string
  error?: string
}

// In-memory storage
const pages = new Map<string, CrawledPage>()

export async function storePage(page: CrawledPage): Promise<void> {
  pages.set(page.id, page)
}

export async function getStoredPages(): Promise<CrawledPage[]> {
  return Array.from(pages.values())
}

export async function getPageById(id: string): Promise<CrawledPage | null> {
  return pages.get(id) || null
}

export async function deletePage(id: string): Promise<void> {
  pages.delete(id)
}

export async function updatePage(id: string, updates: Partial<CrawledPage>): Promise<void> {
  const existing = pages.get(id)
  if (existing) {
    pages.set(id, { ...existing, ...updates })
  }
}

// Utility function to clear all pages (useful for testing)
export async function clearAllPages(): Promise<void> {
  pages.clear()
}
