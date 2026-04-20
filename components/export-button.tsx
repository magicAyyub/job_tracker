"use client"

import { useState } from "react"
import { Download, FileJson, FileSpreadsheet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportApplications } from "@/app/actions"
import { toast } from "sonner"

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: "json" | "csv") => {
    setLoading(true)
    try {
      const data = await exportApplications()

      if (data.count === 0) {
        toast.info("Nothing to export yet")
        return
      }

      const timestamp = new Date().toISOString().split("T")[0]

      if (format === "json") {
        downloadFile(data.json, `applications-${timestamp}.json`, "application/json")
        toast.success(`Exported ${data.count} applications as JSON`)
      } else {
        downloadFile(data.csv, `applications-${timestamp}.csv`, "text/csv")
        toast.success(`Exported ${data.count} applications as CSV`)
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Export failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Export</span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => handleExport("json")} className="gap-3">
          <FileJson className="size-4 text-muted-foreground" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-3">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}