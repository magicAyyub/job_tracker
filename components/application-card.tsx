"use client"

import { useState, useTransition } from "react"
import { ExternalLink, MapPin, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { STATUSES, STATUS_LABEL, type Application, type ApplicationStatus } from "@/lib/types"
import { StatusPill } from "./status-pill"
import { deleteApplication, updateApplication } from "@/app/actions"

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function toDateInput(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 10)
}

export function ApplicationCard({ application }: { application: Application }) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState(application)
  const [pending, startTransition] = useTransition()

  function patch(changes: Partial<Application>) {
    const next = { ...local, ...changes }
    setLocal(next)
    startTransition(async () => {
      try {
        await updateApplication(local.id, changes)
      } catch (err: any) {
        toast.error("Couldn't save", { description: err?.message })
        setLocal(local)
      }
    })
  }

  function onDelete() {
    const confirmed = window.confirm(
      `Delete application to ${local.company} — ${local.role}? This can't be undone.`,
    )
    if (!confirmed) return
    startTransition(async () => {
      try {
        await deleteApplication(local.id)
        toast.success("Application removed")
      } catch (err: any) {
        toast.error("Couldn't delete", { description: err?.message })
      }
    })
  }

  const showResponseField = ["rejected", "offer", "interviewing"].includes(local.status)
  const applied = formatDate(local.applied_at)
  const response = formatDate(local.response_at)

  return (
    <article
      className={cn(
        "group rounded-xl border border-border bg-card transition-colors",
        "hover:border-foreground/20",
        open && "border-foreground/30",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 text-left px-5 py-4"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-serif text-xl leading-tight text-foreground truncate">
              {local.company}
            </h3>
            <span className="text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <p className="text-sm text-muted-foreground truncate">{local.role}</p>
          </div>
          <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
            {applied && <span>Applied {applied}</span>}
            {response && (
              <>
                <span aria-hidden>·</span>
                <span>Heard back {response}</span>
              </>
            )}
            {local.location && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {local.location}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={local.status} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 space-y-6">
          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={pending}
                  onClick={() => patch({ status: s })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    s === local.status
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
                  )}
                  aria-pressed={s === local.status}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Core fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <input
                defaultValue={local.company}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== local.company) patch({ company: v })
                }}
                className="w-full bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm"
              />
            </Field>
            <Field label="Role">
              <input
                defaultValue={local.role}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== local.role) patch({ role: v })
                }}
                className="w-full bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm"
              />
            </Field>
            <Field label="Location">
              <input
                defaultValue={local.location ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v !== (local.location ?? "")) patch({ location: v || null } as any)
                }}
                placeholder="Remote, Paris, …"
                className="w-full bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm placeholder:text-muted-foreground/60"
              />
            </Field>
            <Field label="Link">
              <div className="flex items-center gap-2">
                <input
                  defaultValue={local.url ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== (local.url ?? "")) patch({ url: v || null } as any)
                  }}
                  placeholder="https://…"
                  className="flex-1 bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm placeholder:text-muted-foreground/60"
                />
                {local.url && (
                  <a
                    href={local.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Open link"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </Field>
            <Field label="Applied on">
              <input
                type="date"
                defaultValue={toDateInput(local.applied_at)}
                max={new Date().toISOString().slice(0, 10)}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v && v !== toDateInput(local.applied_at))
                    patch({ applied_at: new Date(v).toISOString() } as any)
                }}
                className="w-full bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm"
              />
            </Field>
          </div>

          <Field label="Job description">
            <textarea
              defaultValue={local.description ?? ""}
              onBlur={(e) => {
                const v = e.target.value
                if (v !== (local.description ?? "")) patch({ description: v || null } as any)
              }}
              rows={4}
              placeholder="Paste or summarize what the role was about…"
              className="w-full bg-transparent border border-border focus:border-foreground/40 outline-none rounded-md p-3 text-sm resize-y placeholder:text-muted-foreground/60"
            />
          </Field>

          <Field label="Private notes">
            <textarea
              defaultValue={local.notes ?? ""}
              onBlur={(e) => {
                const v = e.target.value
                if (v !== (local.notes ?? "")) patch({ notes: v || null } as any)
              }}
              rows={3}
              placeholder="Why you applied, contacts, interview notes…"
              className="w-full bg-transparent border border-border focus:border-foreground/40 outline-none rounded-md p-3 text-sm resize-y placeholder:text-muted-foreground/60"
            />
          </Field>

          {showResponseField && (
            <>
            <Field label="Response date">
              <input
                type="date"
                defaultValue={toDateInput(local.response_at)}
                max={new Date().toISOString().slice(0, 10)}
                onBlur={(e) => {
                  const v = e.target.value
                  const current = toDateInput(local.response_at)
                  if (v !== current)
                    patch({ response_at: v ? new Date(v).toISOString() : null } as any)
                }}
                className="w-full bg-transparent border-b border-border focus:border-foreground/40 outline-none py-1 text-sm"
              />
            </Field>
            <Field
              label={
                local.status === "rejected"
                  ? "Their rejection response"
                  : local.status === "offer"
                    ? "Their offer response"
                    : "Interview communication"
              }
              accent={local.status === "rejected"}
            >
              <textarea
                defaultValue={local.response_text ?? ""}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v !== (local.response_text ?? ""))
                    patch({ response_text: v || null } as any)
                }}
                rows={6}
                placeholder={
                  local.status === "rejected"
                    ? "Paste the rejection email here. Later, we'll analyze these to find patterns and suggest what to work on."
                    : "Paste the message or summarize it."
                }
                className={cn(
                  "w-full bg-transparent border outline-none rounded-md p-3 text-sm resize-y placeholder:text-muted-foreground/60",
                  local.status === "rejected"
                    ? "border-[oklch(0.85_0.07_40)] focus:border-[oklch(0.58_0.14_40)] bg-[oklch(0.97_0.02_40)]"
                    : "border-border focus:border-foreground/40",
                )}
              />
            </Field>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {pending ? "Saving…" : "Changes save automatically"}
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function Field({
  label,
  children,
  accent,
}: {
  label: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label
        className={cn(
          "text-xs uppercase tracking-wider",
          accent ? "text-accent" : "text-muted-foreground",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
