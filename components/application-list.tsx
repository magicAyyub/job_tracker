"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from "@/lib/types"
import { ApplicationCard } from "./application-card"

type Filter = "all" | ApplicationStatus

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export function ApplicationList({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<Filter>("all")

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: applications.length,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
      withdrawn: 0,
    }
    for (const a of applications) c[a.status]++
    return c
  }, [applications])

  const filtered = useMemo(() => {
    if (filter === "all") return applications
    return applications.filter((a) => a.status === filter)
  }, [applications, filter])

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Application[] }>()
    for (const a of filtered) {
      const key = monthKey(a.applied_at)
      if (!map.has(key)) map.set(key, { label: monthLabel(a.applied_at), items: [] })
      map.get(key)!.items.push(a)
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1))
  }, [filtered])

  const filters: Filter[] = ["all", ...STATUSES]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1">
        {filters.map((f) => {
          const active = filter === f
          const label = f === "all" ? "All" : STATUS_LABEL[f]
          const count = counts[f]
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  active ? "text-background/70" : "text-muted-foreground/60",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-10">
          {groups.map(([key, group]) => (
            <section key={key} className="space-y-3">
              <header className="flex items-center gap-3">
                <h2 className="font-serif italic text-sm text-muted-foreground">
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="text-xs text-muted-foreground/80 font-mono tabular-nums">
                  {group.items.length}
                </span>
              </header>
              <div className="space-y-3">
                {group.items.map((a) => (
                  <ApplicationCard key={a.id} application={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <p className="font-serif text-2xl text-foreground/80">
        {filter === "all" ? "Nothing logged yet." : "No applications in this state."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto text-pretty">
        {filter === "all"
          ? "Start by logging your next application above. Two fields, then back to the real work."
          : "When something changes, update the status on any card and it will appear here."}
      </p>
    </div>
  )
}
