import { CustomerNote } from "@/domain/entities/CustomerNote";

/** Verdadeiro quando a nota tem vencimento definido, já passou e ainda não foi quitada. */
export function isNoteOverdue(note: Pick<CustomerNote, "due_date" | "status">): boolean {
  if (!note.due_date || note.status === "pago") return false;
  const today = new Date().toISOString().slice(0, 10);
  return note.due_date.slice(0, 10) < today;
}
