import { notFound } from "next/navigation";
import { container } from "@/container";
import { ReceiptView } from "@/components/sales/ReceiptView";

type Params = { params: Promise<{ id: string }> };

export default async function ImprimirVendaPage({ params }: Params) {
  const { id } = await params;

  const sale = await container.saleRepository.findById(Number(id));
  if (!sale) notFound();

  return <ReceiptView sale={sale} />;
}
