import { CompanySettings, companyDisplayName } from "@/domain/entities/CompanySettings";

export interface CompanyPrintInfo {
  name: string;
  /** Linha auxiliar pro cabeçalho dos impressos, ex: "CNPJ 00.000.000/0000-00 · Belém - PA". */
  detailLine: string | null;
}

/** Monta as informações da empresa pra exibir no topo dos comprovantes/PDFs impressos. */
export function toCompanyPrintInfo(settings: CompanySettings): CompanyPrintInfo {
  const name = companyDisplayName(settings);
  const parts: string[] = [];
  if (settings.cnpj) parts.push(`CNPJ ${settings.cnpj}`);
  if (settings.city && settings.state) parts.push(`${settings.city} - ${settings.state}`);
  else if (settings.city) parts.push(settings.city);
  return { name, detailLine: parts.length > 0 ? parts.join(" · ") : null };
}
