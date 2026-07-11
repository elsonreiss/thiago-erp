import { notFound } from "next/navigation";
import { container } from "@/container";
import { ReceiptView } from "@/components/sales/ReceiptView";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string; autoprint?: string }>;
};

export default async function ImprimirVendaPage({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;

  const sale = await container.saleRepository.findById(Number(id));
  if (!sale) notFound();

  const initialFormat = sp.format === "58" || sp.format === "80" ? sp.format : "a4";
  const autoPrint = sp.autoprint === "1";

  return <ReceiptView sale={sale} initialFormat={initialFormat} autoPrint={autoPrint} />;
}
