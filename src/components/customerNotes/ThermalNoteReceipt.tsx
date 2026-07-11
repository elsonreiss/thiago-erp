import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { isNoteOverdue } from "@/lib/customerNoteOverdue";

/**
 * Versão limpa da nota de cliente (fiado) pra impressão em cupom térmico 80mm:
 * fica escondida na tela ("hidden print:block") e só aparece na hora de imprimir,
 * sem os formulários e botões de administração da página normal.
 */
export function ThermalNoteReceipt({
  note,
  storeName = "Thiago Casa & Construção",
  companyDetail = null,
}: {
  note: CustomerNoteWithItems;
  storeName?: string;
  companyDetail?: string | null;
}) {
  const remaining = Math.max(0, parseFloat(note.total) - parseFloat(note.paid_amount));

  return (
    <div className="hidden print:block">
      <style>{`@page { size: 80mm auto; margin: 0; }`}</style>
      <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[11px] text-black">
        <div className="text-center leading-tight">
          <p className="font-bold uppercase">{storeName}</p>
          {companyDetail && <p>{companyDetail}</p>}
          <p>Nota de cliente (fiado)</p>
          <p>{formatDateTime(note.created_at)}</p>
        </div>
        <div className="my-1 border-t border-dashed border-black" />
        <p>Cliente: {note.customer_name}</p>
        <p>Vendedor: {note.seller_name}</p>
        <p>
          Vencimento: {note.due_date ? formatDate(note.due_date) : "Sem prazo"}
          {isNoteOverdue(note) ? " (ATRASADA)" : ""}
        </p>
        <div className="my-1 border-t border-dashed border-black" />
        {note.items.map((item) => (
          <div key={item.id} className="mb-1 leading-tight">
            <p>{item.product_name}</p>
            <div className="flex justify-between">
              <span>
                {item.quantity} x {formatCurrency(item.unit_price)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
        <div className="my-1 border-t border-dashed border-black" />
        <div className="flex justify-between">
          <span>Total</span>
          <span>{formatCurrency(note.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Pago até agora</span>
          <span>{formatCurrency(note.paid_amount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>SALDO DEVEDOR</span>
          <span>{formatCurrency(remaining)}</span>
        </div>
        {note.description && (
          <>
            <div className="my-1 border-t border-dashed border-black" />
            <p className="leading-tight">Obs: {note.description}</p>
          </>
        )}
        <div className="my-1 border-t border-dashed border-black" />
        <p className="text-center leading-tight">Obrigado pela preferência!</p>
        <p className="text-center text-[9px] leading-tight">Documento sem valor fiscal</p>
      </div>
    </div>
  );
}
