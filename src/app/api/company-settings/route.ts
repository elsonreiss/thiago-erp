import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { container } from "@/container";
import { isAdmin } from "@/domain/entities/User";
import { logAudit } from "@/lib/auditLog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const settings = await container.companySettingsRepository.get();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isAdmin(user.role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const legalName = String(body.legal_name ?? "").trim();
  if (!legalName) {
    return NextResponse.json({ error: "Razão social é obrigatória." }, { status: 400 });
  }

  const asNullableString = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || null;
  };

  try {
    const updated = await container.companySettingsRepository.update({
      legal_name: legalName,
      trade_name: asNullableString(body.trade_name),
      cnpj: asNullableString(body.cnpj),
      state_registration: asNullableString(body.state_registration),
      address: asNullableString(body.address),
      city: asNullableString(body.city),
      state: asNullableString(body.state),
      zip_code: asNullableString(body.zip_code),
      phone: asNullableString(body.phone),
      tax_regime: asNullableString(body.tax_regime),
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "update_company_settings",
      entityType: "company_settings",
      entityId: updated.id,
      details: "Dados da empresa atualizados.",
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error("[PUT /api/company-settings]", err);
    return NextResponse.json({ error: "Erro ao salvar dados da empresa." }, { status: 500 });
  }
}
