import React, { useState } from 'react';
import { 
  DollarSign, 
  BookOpen, 
  ArrowRight, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { LedgerEntry } from '../types';

interface FinanceTabProps {
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function FinanceTab({ ledger, setLedger, addLog }: FinanceTabProps) {
  // Manual Posting Form State
  const [memo, setMemo] = useState('');
  const [debitAcc, setDebitAcc] = useState('Kas Koperasi');
  const [creditAcc, setCreditAcc] = useState('Simpanan Anggota');
  const [amount, setAmount] = useState<number>(100000);
  const [showPostForm, setShowPostForm] = useState(false);

  const accounts = [
    'Kas Koperasi',
    'Persediaan Barang',
    'Piutang Anggota',
    'Simpanan Anggota',
    'Modal Koperasi',
    'Pendapatan Jasa'
  ];

  // Submit manual double posting to ledger
  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memo.trim() || amount <= 0) return;

    if (debitAcc === creditAcc) {
      addLog(`ERROR: Double posting rejected. Debit account cannot be identical to credit account.`, 'error');
      alert("Akun Debit dan Kredit tidak boleh sama!");
      return;
    }

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour12: false });

    // Debit entry
    const deb: LedgerEntry = {
      id: `ledger-deb-man-${Date.now()}`,
      time: currentTime,
      keterangan: `${debitAcc} (Posting: ${memo})`,
      debit: amount,
      kredit: null
    };

    // Credit entry
    const cred: LedgerEntry = {
      id: `ledger-cred-man-${Date.now() + 1}`,
      time: currentTime,
      keterangan: `${creditAcc} (Posting: ${memo})`,
      debit: null,
      kredit: amount
    };

    setLedger(prev => [deb, cred, ...prev]);
    addLog(`SUCCESS: Journal posted successfully! Debit: ${debitAcc} (+Rp${amount.toLocaleString()}), Credit: ${creditAcc} (+Rp${amount.toLocaleString()}).`, 'success');

    // Clear form
    setMemo('');
    setAmount(100000);
    setShowPostForm(false);
  };

  // Calculating aggregate accounts
  // Kas & Bank (Sum debit Kas, subtract credit Kas)
  const calcAccountBalance = (accName: string, defaultType: 'debit' | 'kredit') => {
    let balance = 0;
    ledger.forEach(entry => {
      if (entry.keterangan.includes(accName)) {
        if (defaultType === 'debit') {
          balance += (entry.debit || 0) - (entry.kredit || 0);
        } else {
          balance += (entry.kredit || 0) - (entry.debit || 0);
        }
      }
    });
    return Math.max(0, balance);
  };

  // Base assets/liabilities values
  const kasBalance = calcAccountBalance('Kas Koperasi', 'debit') + 12500000; // base offset
  const persediaanBalance = calcAccountBalance('Persediaan', 'debit') + 8500000;
  const piutangBalance = calcAccountBalance('Piutang', 'debit') + 4000000;
  
  const simpananLiability = calcAccountBalance('Simpanan', 'kredit') + 18000000;
  const modalBalance = calcAccountBalance('Modal', 'kredit') + 7000000;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Cooperative Financials</h1>
          <p className="text-[#64748B] text-sm mt-1">Audit balance sheets, post manual adjustment journals, and inspect the double-entry general ledger book.</p>
        </div>
        <button
          onClick={() => setShowPostForm(true)}
          className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Journal Entry</span>
        </button>
      </div>

      {/* Account Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-left">
          <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-1">Kas &amp; Bank</span>
          <span className="text-lg font-bold text-[#059669]">Rp{kasBalance.toLocaleString('id-ID')}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-left">
          <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-1">Persediaan Barang</span>
          <span className="text-lg font-bold text-[#0F172A]">Rp{persediaanBalance.toLocaleString('id-ID')}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-left">
          <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-1">Piutang Anggota</span>
          <span className="text-lg font-bold text-[#0F172A]">Rp{piutangBalance.toLocaleString('id-ID')}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-left">
          <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-1">Simpanan Terkumpul</span>
          <span className="text-lg font-bold text-indigo-700">Rp{simpananLiability.toLocaleString('id-ID')}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-left">
          <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-1">Modal Koperasi</span>
          <span className="text-lg font-bold text-purple-700">Rp{modalBalance.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Main ledger list view */}
      <section className="enterprise-card select-text">
        <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#006C49]" />
            <span>Buku Besar Jurnal Umum (Double-Entry General Ledger)</span>
          </h3>
          <span className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] font-semibold text-[#475569] px-3 py-1 rounded">
            Balanced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm select-text">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-wider select-none">
                <th className="py-3 px-5">Waktu Transaksi</th>
                <th className="py-3 px-5">Deskripsi Akun &amp; Keterangan</th>
                <th className="py-3 px-5">Debit</th>
                <th className="py-3 px-5">Kredit</th>
                <th className="py-3 px-5 text-right">Kode Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] select-text">
              {ledger.map((entry, index) => {
                const isDebit = entry.debit !== null;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 text-xs text-[#64748B] font-mono select-none">
                      {entry.time}
                    </td>
                    <td className={`py-3 px-5 text-left font-medium ${isDebit ? 'text-[#0F172A]' : 'text-slate-600 pl-10'}`}>
                      {entry.keterangan}
                    </td>
                    <td className={`py-3 px-5 text-left font-bold ${isDebit ? 'text-[#059669]' : 'text-slate-400'}`}>
                      {entry.debit ? `Rp${entry.debit.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`py-3 px-5 text-left font-bold ${!isDebit ? 'text-[#DC2626]' : 'text-slate-400'}`}>
                      {entry.kredit ? `Rp${entry.kredit.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-xs text-slate-400 select-none">
                      TRX-{(10234 + ledger.length - index).toString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manual Journal Entry Posting modal */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 text-left flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#006C49]" />
              <span>Manual Journal Adjustment Entry</span>
            </h3>

            <form onSubmit={handlePostJournal} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Keterangan Transaksi (Memo)
                </label>
                <input
                  type="text"
                  required
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Contoh: Koreksi Persediaan Hilang / Pembayaran Pinjaman"
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Akun Debit (+)
                  </label>
                  <select
                    value={debitAcc}
                    onChange={(e) => setDebitAcc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Akun Kredit (-)
                  </label>
                  <select
                    value={creditAcc}
                    onChange={(e) => setCreditAcc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Nominal Transaksi (Rp)
                </label>
                <input
                  type="number"
                  min="500"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none font-semibold text-[#0F172A]"
                />
              </div>

              <div className="bg-[#FFFBEB] border border-[#FCD34D] p-3 rounded-lg flex items-start gap-2 text-xs text-[#92400E]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <p>
                  Sistem double-entry akan mendebet dan mengkredit akun yang bersangkutan dengan nominal yang setara secara otomatis demi menjaga keseimbangan neraca.
                </p>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
                >
                  Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
