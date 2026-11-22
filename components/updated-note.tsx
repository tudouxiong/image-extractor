import { updatedLabel } from "@/lib/site";

export function UpdatedNote() {
  return <p className="mt-8 text-xs text-muted">Last updated: {updatedLabel}.</p>;
}
