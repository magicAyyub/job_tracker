import { listApplications } from "./actions"
import { QuickAdd } from "@/components/quick-add"
import { ApplicationList } from "@/components/application-list"
import { ExportButton } from "@/components/export-button"
import type { Application } from "@/lib/types"

export const dynamic = "force-dynamic"

function Stats({ applications }: { applications: Application[] }) {
  const total = applications.length
  const rejected = applications.filter((a) => a.status === "rejected").length
  const interviewing = applications.filter((a) => a.status === "interviewing").length
  const offers = applications.filter((a) => a.status === "offer").length

  const items = [
    { label: "Applications", value: total },
    { label: "Interviewing", value: interviewing },
    { label: "Offers", value: offers },
    { label: "Rejections", value: rejected },
  ]

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
      {items.map((item) => (
        <div key={item.label} className="bg-card px-5 py-4">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 font-serif text-3xl tabular-nums text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

async function loadData(): Promise<
  { ok: true; applications: Application[] } | { ok: false; error: string }
> {
  try {
    const applications = await listApplications()
    return { ok: true, applications }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown database error" }
  }
}

export default async function Page() {
  const result = await loadData()

  return (
    <main className="min-h-dvh paper-grain">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8 py-10 sm:py-16">
        <header className="flex items-start justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block size-2 rounded-full bg-accent"
              />
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Letters
              </span>
            </div>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl leading-[1.05] text-balance">
              A quiet record of
              <br />
              <em className="italic text-accent">the rooms you asked into.</em>
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
              Log jobs you apply to, keep the responses you receive, and turn
              rejections into signal.
            </p>
          </div>
        </header>

        {result.ok ? (
          <div className="space-y-10">
            <Stats applications={result.applications} />
            <QuickAdd />
            <ApplicationList applications={result.applications} />
          </div>
        ) : (
          <DbError message={result.error} />
        )}

        <footer className="mt-20 pt-8 border-t border-border text-xs text-muted-foreground flex items-center justify-between gap-4">
          <span>
            {result.ok
              ? `${result.applications.length} ${
                  result.applications.length === 1 ? "entry" : "entries"
                }`
              : "Disconnected"}
          </span>
          <div className="flex items-center gap-4">
            {result.ok && <ExportButton />}
          </div>
          <span className="font-serif italic">Rejection is data.</span>
        </footer>
      </div>
    </main>
  )
}

function DbError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-[oklch(0.97_0.03_30)] p-6">
      <h2 className="font-serif text-xl text-foreground">Can&apos;t reach the database</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Your <code className="font-mono text-xs">DATABASE_URL</code> is set, but
        the app couldn&apos;t connect. If you&apos;re using a local Docker
        Postgres, make sure it&apos;s reachable from where this app is running
        (you may need to expose it with a tunnel such as ngrok, or switch to a
        cloud database like Neon).
      </p>
      <pre className="mt-4 rounded-md bg-card border border-border p-3 text-xs text-muted-foreground overflow-x-auto">
        {message}
      </pre>
      <p className="mt-3 text-xs text-muted-foreground">
        The schema runs automatically on first connect — no manual migration needed.
      </p>
    </div>
  )
}
