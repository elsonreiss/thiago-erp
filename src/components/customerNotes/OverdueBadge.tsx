import { AlertTriangle } from "lucide-react";

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
      <AlertTriangle size={12} /> Atrasada
    </span>
  );
}
