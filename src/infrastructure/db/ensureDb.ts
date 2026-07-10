import { getPool } from "@/infrastructure/db/pool";
import { hashPassword } from "@/infrastructure/auth/password";

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'funcionario',
    photo TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','gerente','funcionario'));
    END IF;
  END $$`,

  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,

  `CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    contact_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)`,

  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    credit_limit NUMERIC(12,2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`,

  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    brand TEXT,
    unit TEXT NOT NULL DEFAULT 'UN',
    description TEXT,
    photo TEXT,
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,

  `CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    payment_method TEXT NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)`,

  `CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)`,

  `CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at)`,

  `CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id)`,

  `CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    validity_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente',
    notes TEXT,
    converted_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE budgets ADD COLUMN IF NOT EXISTS converted_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status)`,

  `CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id)`,

  `CREATE TABLE IF NOT EXISTS customer_notes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    description TEXT,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'aberto',
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
  )`,
  `ALTER TABLE customer_notes ADD COLUMN IF NOT EXISTS due_date DATE`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_notes_status_check') THEN
      ALTER TABLE customer_notes ADD CONSTRAINT customer_notes_status_check CHECK (status IN ('aberto','parcial','pago'));
    END IF;
  END $$`,
  `CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customer_notes_status ON customer_notes(status)`,

  `CREATE TABLE IF NOT EXISTS customer_note_items (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES customer_notes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE customer_note_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  `ALTER TABLE customer_note_items ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS idx_customer_note_items_note_id ON customer_note_items(note_id)`,

  `CREATE TABLE IF NOT EXISTS customer_note_payments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES customer_notes(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_customer_note_payments_note_id ON customer_note_payments(note_id)`,

  `CREATE TABLE IF NOT EXISTS cash_closings (
    id SERIAL PRIMARY KEY,
    closing_date DATE NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    sales_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
    expected_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    counted_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
    difference NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cash_closings_date ON cash_closings(closing_date)`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    amount NUMERIC(12,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`,
];

declare global {
  var __ensureDbPromise: Promise<void> | undefined;
}

async function runMigrations(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    for (const statement of STATEMENTS) {
      await client.query(statement);
    }
    console.log(`[ensureDb] Schema verificado/atualizado (${STATEMENTS.length} statements).`);
  } finally {
    client.release();
  }
}

async function seedInitialAdmin(): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
  if (Number(rows[0]?.count ?? "0") > 0) return;

  const email = process.env.DEFAULT_ADMIN_EMAIL || "elsonreis084@gmail.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "thiago123";
  const { hash, salt } = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, password_salt, role, active)
     VALUES ($1, $2, $3, $4, 'admin', true)
     ON CONFLICT (email) DO NOTHING`,
    ["Administrador", email, hash, salt]
  );

  console.log(
    `[ensureDb] Usuário admin inicial criado -> email: ${email} / senha: ${password} (troque depois de entrar).`
  );
}

export function ensureDb(): Promise<void> {
  if (!global.__ensureDbPromise) {
    global.__ensureDbPromise = runMigrations()
      .then(() => seedInitialAdmin())
      .catch((err) => {
        global.__ensureDbPromise = undefined;
        throw err;
      });
  }
  return global.__ensureDbPromise;
}
