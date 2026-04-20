import { cn } from "@/lib/utils"
import { STATUS_LABEL, type ApplicationStatus } from "@/lib/types"

const STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-muted text-muted-foreground border-border",
  interviewing: "bg-[oklch(0.95_0.04_85)] text-[oklch(0.42_0.08_70)] border-[oklch(0.85_0.06_80)]",
  offer: "bg-[oklch(0.93_0.06_150)] text-[oklch(0.38_0.08_150)] border-[oklch(0.82_0.08_150)]",
  rejected: "bg-[oklch(0.94_0.04_40)] text-[oklch(0.42_0.12_40)] border-[oklch(0.85_0.07_40)]",
  ghosted: "bg-muted text-muted-foreground border-border opacity-80",
  withdrawn: "bg-muted text-muted-foreground border-border opacity-80",
}

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        STYLES[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "applied" && "bg-muted-foreground/60",
          status === "interviewing" && "bg-[oklch(0.55_0.12_70)]",
          status === "offer" && "bg-[oklch(0.5_0.12_150)]",
          status === "rejected" && "bg-[oklch(0.55_0.15_40)]",
          status === "ghosted" && "bg-muted-foreground/40",
          status === "withdrawn" && "bg-muted-foreground/40",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}
