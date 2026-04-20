export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn"

export const STATUSES: ApplicationStatus[] = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
]

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
}

export type Application = {
  id: string
  company: string
  role: string
  location: string | null
  url: string | null
  description: string | null
  notes: string | null
  status: ApplicationStatus
  applied_at: string
  response_at: string | null
  response_text: string | null
  created_at: string
  updated_at: string
}
