import { requireUser } from "@/lib/auth";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-bg-secondary px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
