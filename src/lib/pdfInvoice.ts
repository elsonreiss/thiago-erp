import * as pdfjsLib from "pdfjs-dist";
import { PRODUCT_UNITS } from "@/domain/entities/Product";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface Token {
  str: string;
  x: number;
  y: number;
}

interface Line {
  y: number;
  tokens: Token[];
}

type ColumnKey = "code" | "name" | "ncm" | "cst" | "cfop" | "unit" | "quantity" | "price" | "total";

/** Palavras-chave de cabeçalho reconhecidas na tabela de itens de uma DANFE (nota fiscal eletrônica impressa). */
const HEADER_KEYWORDS: Record<ColumnKey, string[]> = {
  code: ["codigo", "cod produto", "referencia"],
  name: ["descricao"],
  ncm: ["ncm"],
  cst: ["cst", "csosn"],
  cfop: ["cfop"],
  unit: ["unid", "unidade"],
  quantity: ["quant", "qtd", "quantidade"],
  price: ["valor unit", "vl unit", "preco unit", "vlunit"],
  total: ["valor total", "vl total", "vltotal"],
};

const STOP_MARKERS = [
  "dados adicionais",
  "informacoes complementares",
  "reservado ao fisco",
  "calculo do issqn",
  "assinatura do recebedor",
];

export interface ParsedInvoiceItem {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  purchase_price: string;
}

export interface ParsePdfResult {
  items: ParsedInvoiceItem[];
  method: "tabela" | "heuristico";
  rawText: string;
}

async function extractLines(file: File): Promise<{ lines: Line[]; rawText: string }> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const allLines: Line[] = [];
  const rawTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const tokens: Token[] = [];
    for (const item of content.items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyItem = item as any;
      if (typeof anyItem.str !== "string" || anyItem.str.trim() === "") continue;
      tokens.push({ str: anyItem.str, x: anyItem.transform[4], y: anyItem.transform[5] });
    }

    const sorted = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);
    const pageLines: Line[] = [];
    for (const t of sorted) {
      const last = pageLines[pageLines.length - 1];
      if (last && Math.abs(last.y - t.y) <= 2.5) {
        last.tokens.push(t);
        last.tokens.sort((a, b) => a.x - b.x);
      } else {
        pageLines.push({ y: t.y, tokens: [t] });
      }
    }

    allLines.push(...pageLines);
    rawTextParts.push(pageLines.map((l) => l.tokens.map((t) => t.str).join(" ")).join("\n"));
  }

  return { lines: allLines, rawText: rawTextParts.join("\n\n") };
}

function lineText(line: Line): string {
  return line.tokens.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim();
}

function findHeaderLine(lines: Line[]): { line: Line; index: number } | null {
  let best: { line: Line; index: number; score: number } | null = null;

  lines.forEach((line, index) => {
    const normalized = normalize(lineText(line));
    let score = 0;
    for (const keywords of Object.values(HEADER_KEYWORDS)) {
      if (keywords.some((k) => normalized.includes(k))) score++;
    }
    if (score >= 4 && (!best || score > best.score)) {
      best = { line, index, score };
    }
  });

  return best;
}

function matchColumnStarts(line: Line): Partial<Record<ColumnKey, number>> {
  const starts: Partial<Record<ColumnKey, number>> = {};
  const normalizedTokens = line.tokens.map((t) => ({ ...t, norm: normalize(t.str) }));

  for (const key of Object.keys(HEADER_KEYWORDS) as ColumnKey[]) {
    const keywords = HEADER_KEYWORDS[key];
    for (let i = 0; i < normalizedTokens.length; i++) {
      // tenta casar 1 a 3 tokens consecutivos contra a palavra-chave (cabeçalhos costumam vir quebrados em várias palavras).
      for (let span = 1; span <= 3 && i + span <= normalizedTokens.length; span++) {
        const phrase = normalizedTokens
          .slice(i, i + span)
          .map((t) => t.norm)
          .join(" ");
        if (keywords.some((k) => phrase.includes(k))) {
          if (starts[key] === undefined) starts[key] = normalizedTokens[i].x;
        }
      }
    }
  }

  return starts;
}

function parseMoney(text: string): string {
  const normalized = text.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

function parseQuantity(text: string): number {
  const normalized = text.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function normalizeUnit(text: string): string {
  const upper = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = PRODUCT_UNITS.find((u) => u === upper);
  return match ?? "UN";
}

function extractByTable(lines: Line[]): ParsedInvoiceItem[] {
  const header = findHeaderLine(lines);
  if (!header) return [];

  const starts = matchColumnStarts(header.line);
  if (starts.code === undefined || starts.name === undefined) return [];

  // ordena as colunas reconhecidas da esquerda pra direita, pra usar como limites de fatiamento.
  const ordered = (Object.entries(starts) as Array<[ColumnKey, number]>).sort((a, b) => a[1] - b[1]);

  function bucketFor(x: number): ColumnKey | null {
    for (let i = 0; i < ordered.length; i++) {
      const [key, start] = ordered[i];
      const nextStart = ordered[i + 1]?.[1] ?? Infinity;
      if (x >= start && x < nextStart) return key;
    }
    return null;
  }

  const items: ParsedInvoiceItem[] = [];

  for (let i = header.index + 1; i < lines.length; i++) {
    const line = lines[i];
    const text = normalize(lineText(line));
    if (STOP_MARKERS.some((marker) => text.includes(marker))) break;
    if (items.length >= 200) break;

    const buckets: Partial<Record<ColumnKey, string[]>> = {};
    for (const token of line.tokens) {
      const key = bucketFor(token.x);
      if (!key) continue;
      buckets[key] = buckets[key] ?? [];
      buckets[key]!.push(token.str);
    }

    const code = (buckets.code ?? []).join(" ").trim();
    const name = (buckets.name ?? []).join(" ").trim();
    if (!code && !name) continue;
    // linhas sem nenhum dígito no código dificilmente são uma linha de produto (provavelmente é texto de rodapé/observação).
    if (!/\d/.test(code)) continue;

    items.push({
      code,
      name,
      unit: normalizeUnit((buckets.unit ?? []).join(" ")),
      quantity: parseQuantity((buckets.quantity ?? []).join(" ")) || 1,
      purchase_price: parseMoney((buckets.price ?? []).join(" ")),
    });
  }

  return items;
}

/** Último recurso pra notas sem tabela padrão reconhecida: tenta achar quantidade + preço no fim da linha. */
function extractHeuristic(lines: Line[]): ParsedInvoiceItem[] {
  const items: ParsedInvoiceItem[] = [];
  const moneyRegex = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;

  for (const line of lines) {
    const text = lineText(line);
    const matches = [...text.matchAll(moneyRegex)];
    if (matches.length < 1) continue;

    const lastMatch = matches[matches.length - 1];
    const priceText = lastMatch[0];
    const beforePrice = text.slice(0, lastMatch.index).trim();

    // tenta separar uma quantidade numérica solta antes do preço (ex: "10 UN" ou apenas "10").
    const qtyMatch = beforePrice.match(/(\d+(?:[.,]\d+)?)\s*(UN|PC|CX|KG|M2|M3|SC|PAR|ROLO|M|L)?\s*$/i);
    let name = beforePrice;
    let quantity = 1;
    let unit = "UN";
    if (qtyMatch) {
      quantity = parseQuantity(qtyMatch[1]) || 1;
      if (qtyMatch[2]) unit = normalizeUnit(qtyMatch[2]);
      name = beforePrice.slice(0, qtyMatch.index).trim();
    }

    if (name.length < 3) continue;

    items.push({
      code: "",
      name,
      unit,
      quantity,
      purchase_price: parseMoney(priceText),
    });
  }

  return items.slice(0, 200);
}

export async function parseInvoicePdf(file: File): Promise<ParsePdfResult> {
  const { lines, rawText } = await extractLines(file);

  const tableItems = extractByTable(lines);
  if (tableItems.length > 0) {
    return { items: tableItems, method: "tabela", rawText };
  }

  const heuristicItems = extractHeuristic(lines);
  return { items: heuristicItems, method: "heuristico", rawText };
}
