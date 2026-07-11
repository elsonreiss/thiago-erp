export interface CompanySettings {
  id: number;
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
  updated_at: string;
}

/** Nome preferencial pra exibir (nome fantasia, com fallback pra razão social). */
export function companyDisplayName(settings: CompanySettings): string {
  return settings.trade_name?.trim() || settings.legal_name;
}
