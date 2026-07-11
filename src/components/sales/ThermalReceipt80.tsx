import { SaleWithItems } from "@/domain/entities/Sale";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment";

/**
 * Cupom térmico 80mm, invisível na tela e só exibido na hora de imprimir
 * (classe "hidden print:block"). Fica escondido no fim da página de detalhes
 * da venda pra permitir imprimir com um clique, sem navegar pra outra página.
 */
export function ThermalReceipt80({
  sale,
  storeName = "Thiago Casa & Construção",
}: {
  sale: SaleWithItems;
  storeName?: string;
}) {
  const subtotal = sale.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const discount = parseFloat(sale.discount);

  return (
    <div className="hidden print:block">
      <style>{`@page { size: 80mm auto; margin: 0; }`}</style>
      <div className="mx-auto w-[80mm] bg-white p-2 font-mono text-[11px] text-black">
        <div className="text-center leading-tight">
          <p className="font-bold uppercase">{storeName}</p>
          <p>Comprovante de venda</p>
          <p>{formatDateTime(sale.created_at)}</p>
        </div>
        <div className="my-1 border-t border-dashed border-black" />
        <p>Cliente: {sale.customer_name ?? "Consumidor final"}</p>
        <p>Vendedor: {sale.seller_name}</p>
        <p>Pagto: {PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
        <div className="my-1 border-t border-dashed border-black" />
        {sale.items.map((item) => (
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
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        {sale.notes && (
          <>
            <div className="my-1 border-t border-dashed border-black" />
            <p className="leading-tight">Obs: {sale.notes}</p>
          </>
        )}
        <div className="my-1 border-t border-dashed border-black" />
        <p className="text-center leading-tight">Obrigado pela preferência!</p>
      </div>
    </div>
  );
}
