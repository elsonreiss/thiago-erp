/** Formata number|string (vindo do banco como NUMERIC/string) em R$ 1.234,56. */
export function formatCurrency(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(num) ? num : 0
  );
}

/** Converte string de input (aceita vírgula ou ponto) em string numérica "0.00" pro banco. */
export function parseCurrencyInput(value: string): string {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

/**
 * Converte um valor numérico "cru" do banco (ex: "10.5", que usa ponto decimal) no formato
 * brasileiro de exibição em input editável (ex: "10,50", com vírgula decimal). Use isso sempre
 * que for pré-preencher um campo de preço editável a partir de um valor vindo do banco — nunca
 * jogue a string crua do banco direto no input, porque parseCurrencyInput() trata "." como
 * separador de milhar e vai multiplicar o valor por 100+ quando o campo perde o foco sem edição.
 */
export function toCurrencyInputValue(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (!Number.isFinite(num)) return "0,00";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR").format(Number.isFinite(num) ? num : 0);
}

/** Formata "YYYY-MM-DD" ou timestamp ISO do banco em dd/mm/aaaa. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return formatDate(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
