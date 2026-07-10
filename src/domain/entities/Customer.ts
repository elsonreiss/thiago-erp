export interface Customer {
  id: number;
  name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  credit_limit: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
