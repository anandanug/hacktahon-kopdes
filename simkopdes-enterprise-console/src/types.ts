export interface Product {
  id: string;
  name: string;
  category: string;
  stagnantDays: number;
  stock: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  discountAI: number;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface Booking {
  id: string;
  time: string;
  member: string;
  item: string;
  qty: number;
  status: 'Booking' | 'Processing' | 'Success' | 'Cancelled' | 'Failed';
}

export interface LedgerEntry {
  id: string;
  time: string;
  keterangan: string;
  debit: number | null;
  kredit: number | null;
}

export interface Member {
  id: string;
  name: string;
  memberId: string;
  savingsPokok: number;
  savingsWajib: number;
  savingsSukarela: number;
  activeStatus: boolean;
  joinedDate: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
}

export interface SalesRecord {
  id: string;
  date: string;
  productName: string;
  qty: number;
  amount: number;
  memberName: string;
}
