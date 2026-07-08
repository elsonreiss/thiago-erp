import { PoolClient } from "pg";
import { query, withTransaction } from "@/infrastructure/db";
import { PaymentMethod } from "@/domain/entities/Sale";
import {
  CustomerNote,
  CustomerNoteItem,
  CustomerNotePayment,
  CustomerNoteWithItems,
} from "@/domain/entities/CustomerNote";
import {
  CreateCustomerNoteInput,
  CreateCustomerNoteItemInput,
  CustomerNoteFilters,
  CustomerNoteRepository,
  OpenBalanceRow,
} from "@/domain/repositories/CustomerNoteRepository";

type RawNoteRow = CustomerNote & { customer_name: string; seller_name: string };

const NOTE_SELECT = `
  SELECT
    n.*,
    c.name AS customer_name,
    u.name AS seller_name
  FROM customer_notes n
  JOIN customers c ON c.id = n.customer_id
  JOIN users u ON u.id = n.user_id
`;

async function loadItemsAndPayments(
  noteIds: number[]
): Promise<{ itemsByNote: Map<number, CustomerNoteItem[]>; paymentsByNote: Map<number, CustomerNotePayment[]> }> {
  const itemsByNote = new Map<number, CustomerNoteItem[]>();
  const paymentsByNote = new Map<number, CustomerNotePayment[]>();
  if (noteIds.length === 0) return { itemsByNote, paymentsByNote };

  const { rows: items } = await query<CustomerNoteItem>(
    `SELECT * FROM customer_note_items WHERE note_id = ANY($1::int[]) ORDER BY created_at ASC, id ASC`,
    [noteIds]
  );
  for (const item of items) {
    const list = itemsByNote.get(item.note_id) ?? [];
    list.push(item);
    itemsByNote.set(item.note_id, list);
  }

  const { rows: payments } = await query<CustomerNotePayment>(
    `SELECT * FROM customer_note_payments WHERE note_id = ANY($1::int[]) ORDER BY created_at ASC`,
    [noteIds]
  );
  for (const payment of payments) {
    const list = paymentsByNote.get(payment.note_id) ?? [];
    list.push(payment);
    paymentsByNote.set(payment.note_id, list);
  }

  return { itemsByNote, paymentsByNote };
}

async function attach(client: PoolClient, note: RawNoteRow): Promise<CustomerNoteWithItems> {
  const { rows: items } = await client.query<CustomerNoteItem>(
    `SELECT * FROM customer_note_items WHERE note_id = $1 ORDER BY created_at ASC, id ASC`,
    [note.id]
  );
  const { rows: payments } = await client.query<CustomerNotePayment>(
    `SELECT * FROM customer_note_payments WHERE note_id = $1 ORDER BY created_at ASC`,
    [note.id]
  );
  return { ...note, items, payments };
}

async function fetchEnriched(client: PoolClient, noteId: number): Promise<RawNoteRow> {
  const { rows } = await client.query<RawNoteRow>(
    `SELECT n.*, c.name AS customer_name, u.name AS seller_name
     FROM customer_notes n
     JOIN customers c ON c.id = n.customer_id
     JOIN users u ON u.id = n.user_id
     WHERE n.id = $1`,
    [noteId]
  );
  return rows[0];
}

/** Recalcula o total da nota como soma dos itens atuais. */
async function recalculateTotal(client: PoolClient, noteId: number): Promise<string> {
  const { rows } = await client.query<{ total: string }>(
    `SELECT COALESCE(SUM(subtotal), 0)::text AS total FROM customer_note_items WHERE note_id = $1`,
    [noteId]
  );
  const total = rows[0]?.total ?? "0.00";
  await client.query(`UPDATE customer_notes SET total = $1 WHERE id = $2`, [total, noteId]);
  return total;
}

export class PgCustomerNoteRepository implements CustomerNoteRepository {
  async findById(id: number): Promise<CustomerNoteWithItems | null> {
    const { rows } = await query<RawNoteRow>(`${NOTE_SELECT} WHERE n.id = $1`, [id]);
    if (!rows[0]) return null;

    const { itemsByNote, paymentsByNote } = await loadItemsAndPayments([id]);
    return { ...rows[0], items: itemsByNote.get(id) ?? [], payments: paymentsByNote.get(id) ?? [] };
  }

  async findAll(filters: CustomerNoteFilters = {}): Promise<CustomerNoteWithItems[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filters.customerId) {
      conditions.push(`n.customer_id = $${i}`);
      values.push(filters.customerId);
      i++;
    }
    if (filters.status) {
      conditions.push(`n.status = $${i}`);
      values.push(filters.status);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query<RawNoteRow>(`${NOTE_SELECT} ${where} ORDER BY n.created_at DESC`, values);
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const { itemsByNote, paymentsByNote } = await loadItemsAndPayments(ids);

    return rows.map((row) => ({
      ...row,
      items: itemsByNote.get(row.id) ?? [],
      payments: paymentsByNote.get(row.id) ?? [],
    }));
  }

  async create(input: CreateCustomerNoteInput): Promise<CustomerNoteWithItems> {
    return withTransaction(async (client) => {
      let subtotalSum = 0;
      const itemRows: Array<{ product_id: number; product_name: string; quantity: number; unit_price: string; subtotal: string }> = [];

      for (const item of input.items) {
        const { rows: productRows } = await client.query(
          `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
          [item.product_id]
        );
        const product = productRows[0];
        if (!product) throw new Error(`Produto ${item.product_id} não encontrado.`);
        if (product.quantity < item.quantity) {
          throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${product.quantity}).`);
        }

        const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
        subtotalSum += parseFloat(subtotal);
        itemRows.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal,
        });

        // A nota já sai do estoque na hora do lançamento (o cliente já levou a mercadoria).
        await client.query(
          `UPDATE products SET quantity = quantity - $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      const total = subtotalSum.toFixed(2);

      const { rows: noteRows } = await client.query(
        `INSERT INTO customer_notes (customer_id, user_id, description, total, paid_amount, status)
         VALUES ($1,$2,$3,$4,0,'aberto')
         RETURNING *`,
        [input.customer_id, input.user_id, input.description, total]
      );
      const note = noteRows[0];

      for (const item of itemRows) {
        await client.query(
          `INSERT INTO customer_note_items (note_id, product_id, product_name, quantity, unit_price, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [note.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
        );
      }

      const enriched = await fetchEnriched(client, note.id);
      return attach(client, enriched);
    });
  }

  async addItem(noteId: number, item: CreateCustomerNoteItemInput): Promise<CustomerNoteWithItems> {
    await withTransaction(async (client) => {
      const { rows: noteRows } = await client.query<{ status: string }>(
        `SELECT status FROM customer_notes WHERE id = $1 FOR UPDATE`,
        [noteId]
      );
      const note = noteRows[0];
      if (!note) throw new Error("Nota não encontrada.");
      if (note.status === "pago") throw new Error("Esta nota já está quitada — não é possível adicionar itens.");

      const { rows: productRows } = await client.query(
        `SELECT * FROM products WHERE id = $1 FOR UPDATE`,
        [item.product_id]
      );
      const product = productRows[0];
      if (!product) throw new Error(`Produto ${item.product_id} não encontrado.`);
      if (product.quantity < item.quantity) {
        throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${product.quantity}).`);
      }

      const subtotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);

      await client.query(
        `INSERT INTO customer_note_items (note_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [noteId, item.product_id, product.name, item.quantity, item.unit_price, subtotal]
      );
      await client.query(
        `UPDATE products SET quantity = quantity - $1, updated_at = now() WHERE id = $2`,
        [item.quantity, item.product_id]
      );

      const newTotal = await recalculateTotal(client, noteId);

      // Se o total cresceu, uma nota "parcial" ainda pode continuar parcial; nunca vira "pago" sozinha aqui.
      const { rows: paidRows } = await client.query<{ paid_amount: string }>(
        `SELECT paid_amount FROM customer_notes WHERE id = $1`,
        [noteId]
      );
      const paidAmount = parseFloat(paidRows[0]?.paid_amount ?? "0");
      const status = paidAmount <= 0 ? "aberto" : parseFloat(newTotal) - paidAmount <= 0.005 ? "pago" : "parcial";
      await client.query(`UPDATE customer_notes SET status = $1 WHERE id = $2`, [status, noteId]);
    });

    const updated = await this.findById(noteId);
    if (!updated) throw new Error("Nota não encontrada após atualização.");
    return updated;
  }

  async removeItem(noteId: number, itemId: number): Promise<CustomerNoteWithItems> {
    await withTransaction(async (client) => {
      const { rows: noteRows } = await client.query<{ status: string; paid_amount: string }>(
        `SELECT status, paid_amount FROM customer_notes WHERE id = $1 FOR UPDATE`,
        [noteId]
      );
      const note = noteRows[0];
      if (!note) throw new Error("Nota não encontrada.");
      if (note.status === "pago") throw new Error("Esta nota já está quitada — não é possível remover itens.");

      const { rows: itemRows } = await client.query<{ product_id: number | null; quantity: number }>(
        `SELECT product_id, quantity FROM customer_note_items WHERE id = $1 AND note_id = $2`,
        [itemId, noteId]
      );
      const item = itemRows[0];
      if (!item) throw new Error("Item não encontrado nesta nota.");

      const { rows: countRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM customer_note_items WHERE note_id = $1`,
        [noteId]
      );
      if (Number(countRows[0]?.count ?? "0") <= 1) {
        throw new Error("A nota precisa ter ao menos um item.");
      }

      if (item.product_id !== null) {
        await client.query(
          `UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
      await client.query(`DELETE FROM customer_note_items WHERE id = $1`, [itemId]);

      const newTotal = await recalculateTotal(client, noteId);
      const paidAmount = parseFloat(note.paid_amount);
      if (paidAmount > parseFloat(newTotal) + 0.005) {
        throw new Error("Não é possível remover: o valor já pago é maior que o novo total da nota.");
      }
      const status = paidAmount <= 0 ? "aberto" : parseFloat(newTotal) - paidAmount <= 0.005 ? "pago" : "parcial";
      await client.query(`UPDATE customer_notes SET status = $1 WHERE id = $2`, [status, noteId]);
    });

    const updated = await this.findById(noteId);
    if (!updated) throw new Error("Nota não encontrada após atualização.");
    return updated;
  }

  async registerPayment(id: number, amount: string, paymentMethod: PaymentMethod): Promise<CustomerNoteWithItems> {
    await withTransaction(async (client) => {
      const { rows } = await client.query<{ total: string; paid_amount: string; status: string }>(
        `SELECT total, paid_amount, status FROM customer_notes WHERE id = $1 FOR UPDATE`,
        [id]
      );
      const note = rows[0];
      if (!note) throw new Error("Nota não encontrada.");
      if (note.status === "pago") throw new Error("Esta nota já está quitada.");

      const total = parseFloat(note.total);
      const alreadyPaid = parseFloat(note.paid_amount);
      const amountNum = parseFloat(amount);
      const remaining = Math.max(0, total - alreadyPaid);

      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero.");
      }
      if (amountNum > remaining + 0.005) {
        throw new Error(`Valor maior que o saldo devedor (${remaining.toFixed(2)}).`);
      }

      const newPaidNum = Math.min(total, alreadyPaid + amountNum);
      const newPaid = newPaidNum.toFixed(2);
      const newStatus = newPaidNum >= total - 0.005 ? "pago" : "parcial";

      await client.query(
        `UPDATE customer_notes
         SET paid_amount = $1, status = $2, paid_at = CASE WHEN $2 = 'pago' THEN now() ELSE paid_at END
         WHERE id = $3`,
        [newPaid, newStatus, id]
      );
      await client.query(
        `INSERT INTO customer_note_payments (note_id, amount, payment_method) VALUES ($1, $2, $3)`,
        [id, amountNum.toFixed(2), paymentMethod]
      );
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Nota não encontrada após atualização.");
    return updated;
  }

  async attachSale(id: number, saleId: number): Promise<void> {
    await query(`UPDATE customer_notes SET sale_id = $1 WHERE id = $2`, [saleId, id]);
  }

  async delete(id: number): Promise<void> {
    await withTransaction(async (client) => {
      const { rows: items } = await client.query<{ product_id: number | null; quantity: number }>(
        `SELECT product_id, quantity FROM customer_note_items WHERE note_id = $1`,
        [id]
      );
      for (const item of items) {
        if (item.product_id === null) continue;
        await client.query(
          `UPDATE products SET quantity = quantity + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
      await client.query(`DELETE FROM customer_notes WHERE id = $1`, [id]);
    });
  }

  async openBalanceByCustomer(): Promise<OpenBalanceRow[]> {
    const { rows } = await query<{ customer_id: number; customer_name: string; balance: string; notes_count: string }>(
      `SELECT c.id AS customer_id, c.name AS customer_name,
              COALESCE(SUM(n.total - n.paid_amount), 0)::text AS balance,
              COUNT(n.id)::text AS notes_count
       FROM customer_notes n
       JOIN customers c ON c.id = n.customer_id
       WHERE n.status IN ('aberto','parcial')
       GROUP BY c.id, c.name
       HAVING SUM(n.total - n.paid_amount) > 0
       ORDER BY SUM(n.total - n.paid_amount) DESC`
    );
    return rows.map((r) => ({
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      balance: Number(r.balance),
      notes_count: Number(r.notes_count),
    }));
  }
}
