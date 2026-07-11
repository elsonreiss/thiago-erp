import { query } from "@/infrastructure/db";
import { CompanySettings } from "@/domain/entities/CompanySettings";
import {
  CompanySettingsRepository,
  UpdateCompanySettingsInput,
} from "@/domain/repositories/CompanySettingsRepository";

export class PgCompanySettingsRepository implements CompanySettingsRepository {
  async get(): Promise<CompanySettings> {
    const { rows } = await query<CompanySettings>(`SELECT * FROM company_settings WHERE id = 1`);
    if (rows[0]) return rows[0];
    // Defesa extra: se por algum motivo o seed não rodou, cria a linha na hora.
    const { rows: inserted } = await query<CompanySettings>(
      `INSERT INTO company_settings (id, legal_name) VALUES (1, 'Thiago Casa & Construção')
       ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
       RETURNING *`
    );
    return inserted[0];
  }

  async update(input: UpdateCompanySettingsInput): Promise<CompanySettings> {
    const { rows } = await query<CompanySettings>(
      `UPDATE company_settings
       SET legal_name = $1, trade_name = $2, cnpj = $3, state_registration = $4,
           address = $5, city = $6, state = $7, zip_code = $8, phone = $9, tax_regime = $10,
           updated_at = now()
       WHERE id = 1
       RETURNING *`,
      [
        input.legal_name,
        input.trade_name,
        input.cnpj,
        input.state_registration,
        input.address,
        input.city,
        input.state,
        input.zip_code,
        input.phone,
        input.tax_regime,
      ]
    );
    return rows[0];
  }
}
