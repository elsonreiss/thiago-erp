import { CompanySettings } from "@/domain/entities/CompanySettings";

export interface UpdateCompanySettingsInput {
  legal_name: string;
  trade_name: string | null;
  cnpj: string | null;
  state_registration: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  tax_regime: string | null;
}

export interface CompanySettingsRepository {
  /** Sempre retorna a linha única (id=1) — nunca null, já que é seedada no ensureDb(). */
  get(): Promise<CompanySettings>;
  update(input: UpdateCompanySettingsInput): Promise<CompanySettings>;
}
