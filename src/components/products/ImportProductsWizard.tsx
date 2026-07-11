"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { DEFAULT_PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/domain/entities/Product";
import {
  DraftProduct,
  IMPORT_FIELDS,
  ImportableField,
  buildDraftProducts,
  guessColumnMapping,
} from "@/lib/productImport";
import { parseInvoicePdf } from "@/lib/pdfInvoice";
import { parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";

type Source = "spreadsheet" | "pdf";
type Step = "upload" | "mapping" | "preview" | "result";

interface RowResult {
  index: number;
  code: string;
  name: string;
  success: boolean;
  error?: string;
}

interface DraftRow extends DraftProduct {
  key: string;
}

export function ImportProductsWizard() {
  const router = useRouter();
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [source, setSource] = useState<Source>("spreadsheet");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportableField, number>>>({});
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfConfidence, setPdfConfidence] = useState<"tabela" | "heuristico" | null>(null);
  const [pdfRawText, setPdfRawText] = useState<string>("");
  const [showRawText, setShowRawText] = useState(false);

  function resetAll() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setDrafts([]);
    setResults(null);
    setError(null);
    setPdfConfidence(null);
    setPdfRawText("");
    setShowRawText(false);
    if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  async function handleSpreadsheetFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("Planilha vazia ou inválida.");
      const sheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
      });

      if (matrix.length < 2) {
        throw new Error("A planilha precisa ter uma linha de cabeçalho e ao menos uma linha de dados.");
      }

      const [headerRow, ...dataRows] = matrix;
      const cleanHeaders = headerRow.map((h) => String(h ?? "").trim());
      const cleanRows = dataRows
        .map((row) => cleanHeaders.map((_, i) => String(row[i] ?? "").trim()))
        .filter((row) => row.some((cell) => cell !== ""));

      setHeaders(cleanHeaders);
      setRawRows(cleanRows);
      setMapping(guessColumnMapping(cleanHeaders));
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler a planilha.");
    } finally {
      setParsing(false);
    }
  }

  async function handlePdfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    setFileName(file.name);

    try {
      const result = await parseInvoicePdf(file);
      setPdfConfidence(result.method);
      setPdfRawText(result.rawText);

      if (result.items.length === 0) {
        throw new Error(
          "Não consegui identificar produtos nesse PDF automaticamente. Veja o texto extraído abaixo, ou tente uma planilha."
        );
      }

      const built: DraftRow[] = result.items.map((item, i) => ({
        code: item.code || `PDF-${i + 1}`,
        name: item.name,
        category: "Outros",
        brand: null,
        unit: item.unit,
        barcode: null,
        purchase_price: item.purchase_price,
        sale_price: "0.00",
        min_stock: 0,
        quantity: item.quantity,
        location: null,
        key: `${i}-${Date.now()}`,
      }));

      setDrafts(built);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler o PDF.");
    } finally {
      setParsing(false);
    }
  }

  function goToPreview() {
    if (mapping.code === undefined || mapping.name === undefined) {
      setError("Selecione ao menos as colunas de Código e Nome antes de continuar.");
      return;
    }
    setError(null);
    const built = buildDraftProducts(rawRows, mapping);
    setDrafts(built.map((d, i) => ({ ...d, key: `${i}-${Date.now()}` })));
    setStep("preview");
  }

  function updateDraft(key: string, patch: Partial<DraftRow>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function removeDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  async function handleImport() {
    setError(null);
    const invalid = drafts.some((d) => !d.code.trim() || !d.name.trim());
    if (invalid) {
      setError("Todo produto precisa de código e nome preenchidos.");
      return;
    }
    if (drafts.length === 0) {
      setError("Nenhum produto para importar.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        products: drafts.map((d) => ({
          code: d.code.trim(),
          name: d.name.trim(),
          category: d.category,
          brand: d.brand,
          unit: d.unit,
          barcode: d.barcode,
          purchase_price: parseCurrencyInput(d.purchase_price),
          sale_price: parseCurrencyInput(d.sale_price),
          min_stock: d.min_stock,
          quantity: d.quantity,
          location: d.location,
        })),
      };
      const res = await fetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao importar produtos.");
        return;
      }
      setResults(data.results as RowResult[]);
      setStep("result");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator step={step} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </p>
      )}

      {step === "upload" && (
        <div className="price-tag-card rounded-xl p-6">
          <div className="mb-5 inline-flex rounded-lg border border-border bg-bg-secondary p-1">
            <button
              type="button"
              onClick={() => setSource("spreadsheet")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "spreadsheet"
                  ? "bg-accent text-accent-foreground"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <FileSpreadsheet size={15} /> Planilha
            </button>
            <button
              type="button"
              onClick={() => setSource("pdf")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "pdf"
                  ? "bg-accent text-accent-foreground"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <FileText size={15} /> PDF de nota fiscal
            </button>
          </div>

          {source === "spreadsheet" ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border py-12 text-center">
              <FileSpreadsheet size={36} className="text-text-muted" />
              <div>
                <p className="font-medium text-text-primary">Selecione uma planilha (.xlsx, .xls ou .csv)</p>
                <p className="mt-1 text-sm text-text-secondary">
                  A primeira linha deve ter os cabeçalhos das colunas (código, nome, preço, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={() => spreadsheetInputRef.current?.click()}
                disabled={parsing}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {parsing ? "Lendo arquivo..." : "Escolher arquivo"}
              </button>
              <input
                ref={spreadsheetInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleSpreadsheetFile}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border py-12 text-center">
              <FileText size={36} className="text-text-muted" />
              <div className="max-w-md">
                <p className="font-medium text-text-primary">Selecione o PDF da nota fiscal (DANFE)</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Funciona melhor com o PDF gerado direto do sistema do fornecedor (texto selecionável, não foto
                  escaneada). O reconhecimento é automático, mas <strong>sempre revise</strong> antes de confirmar —
                  cada fornecedor formata a nota de um jeito.
                </p>
              </div>
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={parsing}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
              >
                {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {parsing ? "Lendo PDF..." : "Escolher PDF"}
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfFile}
              />
            </div>
          )}

          {source === "pdf" && pdfRawText && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowRawText((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
              >
                <ChevronDown size={14} className={showRawText ? "rotate-180 transition-transform" : "transition-transform"} />
                Ver texto extraído do PDF
              </button>
              {showRawText && (
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-bg-secondary p-3 text-xs text-text-secondary">
                  {pdfRawText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {step === "mapping" && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-1 font-display text-base font-semibold text-text-primary">
            Confira as colunas de &ldquo;{fileName}&rdquo;
          </h2>
          <p className="mb-4 text-sm text-text-secondary">
            {rawRows.length} linha{rawRows.length === 1 ? "" : "s"} encontrada{rawRows.length === 1 ? "" : "s"}. Ajuste
            o mapeamento se o sistema não adivinhou certo.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMPORT_FIELDS.map(({ field, label, required }) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">
                  {label} {required && <span className="text-danger">*</span>}
                </span>
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field]: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">— não importar —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Coluna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={goToPreview}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Ver prévia
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-1 font-display text-base font-semibold text-text-primary">
            Revise antes de cadastrar
          </h2>
          <p className="mb-2 text-sm text-text-secondary">
            {drafts.length} produto{drafts.length === 1 ? "" : "s"} pronto{drafts.length === 1 ? "" : "s"} pra
            importar. Corrija o que precisar — nada é salvo até você confirmar.
          </p>

          {pdfConfidence === "heuristico" && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
              <AlertTriangle size={14} className="shrink-0" />
              Não reconheci uma tabela padrão de nota fiscal nesse PDF — os dados abaixo vieram de uma tentativa mais
              genérica e podem ter erros. Revise linha por linha com atenção, principalmente código e preço de venda
              (que a nota de compra não traz).
            </p>
          )}
          {pdfConfidence === "tabela" && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
              <CheckCircle2 size={14} className="shrink-0" />
              Reconheci a tabela de itens da nota fiscal. Preço de venda não vem da nota — defina antes de confirmar.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="py-2 pr-2 font-medium">Código</th>
                  <th className="py-2 pr-2 font-medium">Nome</th>
                  <th className="py-2 pr-2 font-medium">Categoria</th>
                  <th className="py-2 pr-2 font-medium">Unidade</th>
                  <th className="py-2 pr-2 font-medium text-right">Preço compra</th>
                  <th className="py-2 pr-2 font-medium text-right">Preço venda</th>
                  <th className="py-2 pr-2 font-medium text-right">Qtd.</th>
                  <th className="py-2 pr-2 font-medium text-right">-</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.key} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2">
                      <input
                        value={d.code}
                        onChange={(e) => updateDraft(d.key, { code: e.target.value })}
                        className={cellInputClass}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={d.name}
                        onChange={(e) => updateDraft(d.key, { name: e.target.value })}
                        className={`${cellInputClass} min-w-[160px]`}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={d.category}
                        onChange={(e) => updateDraft(d.key, { category: e.target.value })}
                        className={cellInputClass}
                      >
                        {DEFAULT_PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={d.unit}
                        onChange={(e) => updateDraft(d.key, { unit: e.target.value })}
                        className={cellInputClass}
                      >
                        {PRODUCT_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <input
                        value={d.purchase_price}
                        onChange={(e) => updateDraft(d.key, { purchase_price: e.target.value })}
                        onBlur={(e) =>
                          updateDraft(d.key, { purchase_price: toCurrencyInputValue(parseCurrencyInput(e.target.value)) })
                        }
                        className={`${cellInputClass} text-right font-numeric`}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <input
                        value={d.sale_price}
                        onChange={(e) => updateDraft(d.key, { sale_price: e.target.value })}
                        onBlur={(e) =>
                          updateDraft(d.key, { sale_price: toCurrencyInputValue(parseCurrencyInput(e.target.value)) })
                        }
                        className={`${cellInputClass} text-right font-numeric`}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={d.quantity}
                        onChange={(e) => updateDraft(d.key, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                        className={`${cellInputClass} w-20 text-right font-numeric`}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeDraft(d.key)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep(source === "spreadsheet" ? "mapping" : "upload")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={submitting || drafts.length === 0}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Cadastrando..." : `Cadastrar ${drafts.length} produto${drafts.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}

      {step === "result" && results && (
        <div className="price-tag-card rounded-xl p-6">
          <h2 className="mb-1 font-display text-base font-semibold text-text-primary">Importação concluída</h2>
          <p className="mb-4 text-sm text-text-secondary">
            {results.filter((r) => r.success).length} de {results.length} produtos cadastrados com sucesso.
          </p>

          <div className="flex flex-col gap-1.5">
            {results.map((r) => (
              <div
                key={r.index}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {r.success ? (
                    <CheckCircle2 size={15} className="shrink-0 text-success" />
                  ) : (
                    <XCircle size={15} className="shrink-0 text-danger" />
                  )}
                  <span className="truncate text-text-primary">
                    {r.code} — {r.name || "(sem nome)"}
                  </span>
                </div>
                {!r.success && <span className="shrink-0 text-xs text-danger">{r.error}</span>}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              Importar outro arquivo
            </button>
            <button
              type="button"
              onClick={() => router.push("/estoque")}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Ver estoque
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cellInputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function StepIndicator({ step }: { step: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: "upload", label: "1. Enviar arquivo" },
    { key: "mapping", label: "2. Mapear colunas" },
    { key: "preview", label: "3. Revisar" },
    { key: "result", label: "4. Resultado" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <span
          key={s.key}
          className={`rounded-full px-3 py-1.5 font-medium ${
            i === currentIndex
              ? "bg-accent text-accent-foreground"
              : i < currentIndex
                ? "bg-success-soft text-success"
                : "bg-bg-tertiary text-text-muted"
          }`}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}
