/** Gera um CSV (separado por ;, compatível com Excel pt-BR) a partir de cabeçalhos e linhas. */
export function buildCsv(headers: string[], rows: Array<Array<string | number>>): string {
  function escape(value: string | number): string {
    const str = String(value);
    if (/[;"\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [headers.map(escape).join(";"), ...rows.map((row) => row.map(escape).join(";"))];
  // BOM no início ajuda o Excel a reconhecer UTF-8 corretamente.
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
