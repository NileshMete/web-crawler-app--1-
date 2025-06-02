import { type NextRequest, NextResponse } from "next/server"
import { getPageById } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf-generator"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const page = await getPageById(id)

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    const pdfBuffer = await generatePDF(page)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${page.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
