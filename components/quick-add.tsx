"use client"

import { useRef, useState, useTransition } from "react"
import { ArrowRight, ChevronDown, Plus } from "lucide-react"
import { toast } from "sonner"
import { createApplication } from "@/app/actions"
import { cn } from "@/lib/utils"

export function QuickAdd() {
  const [expanded, setExpanded] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const companyRef = useRef<HTMLInputElement>(null)

  const todayISO = new Date().toISOString().slice(0, 10)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const company = String(formData.get("company") ?? "").trim()
    const role = String(formData.get("role") ?? "").trim()
    if (!company || !role) {
      toast.error("Company and role are required")
      return
    }
    startTransition(async () => {
      try {
        await createApplication(formData)
        formRef.current?.reset()
        setExpanded(false)
        companyRef.current?.focus()
        toast.success("Application logged", {
          description: `${company} — ${role}`,
        })
      } catch (err: any) {
        toast.error("Couldn't save", { description: err?.message })
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={cn(
        "group rounded-xl border border-border bg-card transition-all",
        "focus-within:border-foreground/30 focus-within:shadow-[0_1px_0_0_var(--border),0_10px_30px_-18px_oklch(0_0_0/0.25)]",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-0">
        <div className="flex-1 flex items-center">
          <span
            aria-hidden
            className="pl-4 pr-2 text-muted-foreground/60 font-serif text-lg leading-none"
          >
            ·
          </span>
          <input
            ref={companyRef}
            name="company"
            required
            autoComplete="off"
            placeholder="Company"
            className="flex-1 bg-transparent py-4 pr-3 text-base outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <span
          aria-hidden
          className="hidden sm:block h-6 w-px bg-border mx-1"
        />

        <div className="flex-[1.2] flex items-center border-t sm:border-t-0 border-border">
          <input
            name="role"
            required
            autoComplete="off"
            placeholder="Role you applied for"
            className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center gap-1 pr-2 border-t sm:border-t-0 border-border">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground",
              "hover:bg-muted hover:text-foreground transition",
            )}
            aria-expanded={expanded}
            aria-controls="quick-add-details"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            />
            Details
          </button>
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "m-1 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background",
              "hover:bg-foreground/90 transition disabled:opacity-60",
            )}
          >
            {pending ? (
              <span className="size-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            <span className="hidden sm:inline">Log</span>
            <ArrowRight className="size-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id="quick-add-details"
          className="grid gap-0 sm:grid-cols-2 border-t border-border"
        >
          <label className="flex items-center gap-3 px-4 py-3 sm:border-r border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">
              Link
            </span>
            <input
              name="url"
              type="url"
              placeholder="https://…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <label className="flex items-center gap-3 px-4 py-3 border-t sm:border-t-0 border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">
              Location
            </span>
            <input
              name="location"
              placeholder="Remote, Berlin, …"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <label className="flex items-center gap-3 px-4 py-3 border-t sm:border-r border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">
              Applied
            </span>
            <input
              name="applied_at"
              type="date"
              defaultValue={todayISO}
              max={todayISO}
              className="flex-1 bg-transparent text-sm outline-none text-muted-foreground"
            />
          </label>
          <label className="flex items-center gap-3 px-4 py-3 border-t border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">
              Notes
            </span>
            <input
              name="notes"
              placeholder="Quick note…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <label className="sm:col-span-2 flex gap-3 px-4 py-3 border-t border-border">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-16 pt-1">
              Job desc.
            </span>
            <textarea
              name="description"
              rows={3}
              placeholder="Paste the job description or a short summary…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 resize-y"
            />
          </label>
        </div>
      )}
    </form>
  )
}
