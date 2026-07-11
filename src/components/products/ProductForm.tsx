"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Barcode, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { DEFAULT_PRODUCT_CATEGORIES, PRODUCT_UNITS, Product } from "@/domain/entities/Product";
import { Supplier } from "@/domain/entities/Supplier";
import { resizeAndCompressImage } from "@/lib/image";
import { parseCurrencyInput, toCurrencyInputValue } from "@/lib/format";
import { Autocomplete } from "@/components/ui/Autocomplete";

export function ProductForm({ product, initialSupplier }: { product?: Product; initialSupplier?: Supplier | null }) {
  const isEditing = !!product;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(product?.photo ?? null);
  const [supplier, setSupplier] = useState<Supplier | null>(initialSupplier ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(product?.barcode ?? "");
  const [duplicate, setDuplicate] = useState<{ id: number; name: string; code: string } | null>(null);
  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingPhoto(true);
    try {
      const compressed = await resizeAndCompressImage(file, { maxSize: 480, quality: 0.85 });
      setPhoto(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar a imagem.");
    } finally {
      setProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function checkDuplicateBarcode(value: string) {
    const trimmed = value.trim();
    setDuplicate(null);
    if (!trimmed) return;
    setCheckingBarcode(true);
    try {
      const res = await fetch(`/api/products/lookup?code=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const found = data.product;
      if (found && found.id !== product?.id) {
        setDuplicate({ id: found.id, name: found.name, code: found.code });
      }
    } catch {
      // Sem conexão: não bloqueia o cadastro, só não avisa sobre duplicidade.
    } finally {
      setCheckingBarcode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      code: String(form.get("code") ?? "").trim(),
      barcode: (String(form.get("barcode") ?? "").trim() || null),
      name: String(form.get("name") ?? "").trim(),
      category: String(form.get("category") ?? "Outros"),
      brand: (String(form.get("brand") ?? "").trim() || null),
      unit: String(form.get("unit") ?? "UN"),
      description: (String(form.get("description") ?? "").trim() || null),
      photo,
      purchase_price: parseCurrencyInput(String(form.get("purchase_price") ?? "0")),
      sale_price: parseCurrencyInput(String(form.get("sale_price") ?? "0")),
      min_stock: Number(form.get("min_stock") ?? 0),
      quantity: Number(form.get("quantity") ?? 0),
      location: (String(form.get("location") ?? "").trim() || null),
      supplier_id: supplier?.id ?? null,
    };

    try {
      const res = await fetch(isEditing ? `/api/products/${product!.id}` : "/api/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar produto.");
        return;
      }
      router.push("/estoque");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Foto</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-secondary">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={24} className="text-text-muted" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingPhoto}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary disabled:opacity-60"
            >
              {processingPhoto ? "Processando..." : photo ? "Trocar foto" : "Adicionar foto"}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="flex items-center gap-1 text-sm text-danger hover:underline"
              >
                <Trash2 size={14} /> Remover foto
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Identificação</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Código *">
            <input name="code" required defaultValue={product?.code} className={inputClass} />
          </Field>
          <Field label="Código de barras">
            <div className="flex items-center gap-2">
              <Barcode size={16} className="shrink-0 text-text-muted" />
              <input
                name="barcode"
                value={barcodeValue}
                onChange={(e) => {
                  setBarcodeValue(e.target.value);
                  setDuplicate(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    checkDuplicateBarcode(e.currentTarget.value);
                    nameInputRef.current?.focus();
                  }
                }}
                onBlur={(e) => checkDuplicateBarcode(e.target.value)}
                placeholder="Escaneie ou digite o código de barras..."
                className={inputClass}
              />
              {checkingBarcode && <Loader2 size={14} className="shrink-0 animate-spin text-text-muted" />}
            </div>
            {duplicate && (
              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>
                  Já existe um produto com esse código: <strong>{duplicate.name}</strong> ({duplicate.code}).{" "}
                  <Link href={`/estoque/${duplicate.id}`} className="underline hover:opacity-80">
                    Ver produto
                  </Link>
                </span>
              </p>
            )}
          </Field>
          <Field label="Nome *" className="sm:col-span-2 lg:col-span-1">
            <input ref={nameInputRef} name="name" required defaultValue={product?.name} className={inputClass} />
          </Field>
          <Field label="Categoria *">
            <select name="category" required defaultValue={product?.category ?? DEFAULT_PRODUCT_CATEGORIES[0]} className={inputClass}>
              {DEFAULT_PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Marca">
            <input name="brand" defaultValue={product?.brand ?? ""} className={inputClass} />
          </Field>
          <Field label="Unidade *">
            <select name="unit" required defaultValue={product?.unit ?? "UN"} className={inputClass}>
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Descrição">
            <textarea name="description" rows={3} defaultValue={product?.description ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Fornecedor</h2>
        {supplier ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm">
            <span className="text-text-primary">{supplier.name}</span>
            <button
              type="button"
              onClick={() => setSupplier(null)}
              className="text-text-muted hover:text-danger"
              aria-label="Remover fornecedor"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <Autocomplete<Supplier>
            searchUrl="/api/suppliers/autocomplete"
            responseKey="suppliers"
            getKey={(s) => s.id}
            getLabel={(s) => s.name}
            getSubLabel={(s) => s.cnpj || s.city || ""}
            onSelect={setSupplier}
            placeholder="Buscar fornecedor por nome ou CNPJ..."
          />
        )}
      </div>

      <div className="price-tag-card rounded-xl p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text-primary">Preços e estoque</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Preço de compra (R$)">
            <input
              name="purchase_price"
              type="text"
              inputMode="decimal"
              defaultValue={product ? toCurrencyInputValue(product.purchase_price) : "0,00"}
              className={`${inputClass} font-numeric`}
            />
          </Field>
          <Field label="Preço de venda (R$) *">
            <input
              name="sale_price"
              type="text"
              inputMode="decimal"
              required
              defaultValue={product ? toCurrencyInputValue(product.sale_price) : "0,00"}
              className={`${inputClass} font-numeric`}
            />
          </Field>
          <Field label="Estoque mínimo *">
            <input
              name="min_stock"
              type="number"
              min={0}
              required
              defaultValue={product?.min_stock ?? 0}
              className={`${inputClass} font-numeric`}
            />
          </Field>
          <Field label="Quantidade *">
            <input
              name="quantity"
              type="number"
              min={0}
              required
              defaultValue={product?.quantity ?? 0}
              className={`${inputClass} font-numeric`}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Localização (corredor/prateleira)">
            <input name="location" defaultValue={product?.location ?? ""} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/estoque")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}
