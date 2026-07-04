import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Calendar, 
  ChevronDown, 
  Check, 
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { Product, LedgerEntry, Member } from '../types';

interface ReportsTabProps {
  products: Product[];
  ledger: LedgerEntry[];
  members: Member[];
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function ReportsTab({ products, ledger, members, addLog }: ReportsTabProps) {
  const [reportType, setReportType] = useState<'inventory' | 'finance' | 'members'>('inventory');
  const [dateScope, setDateScope] = useState('Bulan Ini');
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleGenerateReport = () => {
    addLog(`REPORTS: Commencing dynamic assembly of '${reportType}' audit records...`, 'info');
    
    setTimeout(() => {
      setGeneratedReport({
        timestamp: new Date().toLocaleString('id-ID'),
        scope: dateScope,
        type: reportType
      });
      addLog(`REPORTS: Printable report compiled and locked.`, 'success');
    }, 400);
  };

  const handlePrint = () => {
    addLog(`PRINT: Spooling compiled report paper payload to local printer queue.`, 'success');
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none text-left">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Cooperative Audits &amp; Reports</h1>
          <p className="text-[#64748B] text-sm mt-1">Compile comprehensive tax ledgers, physical inventory reports, and active member sheets.</p>
        </div>
      </div>

      {/* Reports Generator Settings Block */}
      <div className="bg-white p-5 border border-[#E2E8F0] rounded-xl shadow-sm text-left grid grid-cols-1 md:grid-cols-4 gap-4 items-end select-none">
        <div>
          <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
            Jenis Laporan Audit
          </label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as any);
              setGeneratedReport(null);
            }}
            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:border-[#006C49] outline-none font-semibold text-[#0F172A]"
          >
            <option value="inventory">Laporan Fisik Inventaris (Stock Auditing)</option>
            <option value="finance">Neraca Buku Besar Jurnal (Financial Ledger)</option>
            <option value="members">Pernyataan Simpanan Anggota (Savings Summary)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
            Cakupan Periode Waktu
          </label>
          <select
            value={dateScope}
            onChange={(e) => setDateScope(e.target.value)}
            className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:border-[#006C49] outline-none font-semibold text-[#0F172A]"
          >
            <option value="Hari Ini">Hari Ini (Real-Time)</option>
            <option value="Minggu Ini">Minggu Ini (7 Hari Terakhir)</option>
            <option value="Bulan Ini">Bulan Ini (Juni/Juli 2026)</option>
            <option value="Tahun Ini">Tahun Buku 2026</option>
          </select>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button
            onClick={handleGenerateReport}
            className="flex-1 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Audited Report</span>
          </button>

          {generatedReport && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Generated Printable Sheet Report Card */}
      {generatedReport ? (
        <div className="bg-white border border-[#CBD5E1] p-8 rounded-xl shadow-md max-w-3xl mx-auto w-full text-left font-sans select-text select-all">
          {/* Printable Sheet Logo Branding Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                🏛️ Koperasi Simpan Pinjam SIMKOPDES
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kecamatan Pedes, Kabupaten Karawang, Jawa Barat
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                AUDITED PAYLOAD
              </span>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{generatedReport.timestamp}</p>
            </div>
          </div>

          {/* Subtitle audit meta info */}
          <div className="mb-6 space-y-1">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              {reportType === 'inventory' && 'LAPORAN REKAPITULASI INVENTARIS BARANG'}
              {reportType === 'finance' && 'LAPORAN REKAPITULASI BUKU BESAR JURNAL UMUM'}
              {reportType === 'members' && 'LAPORAN AKUMULASI SIMPANAN WAJIB & POKOK ANGGOTA'}
            </h3>
            <p className="text-xs text-slate-500">
              Periode Cakupan Audit: <span className="font-bold text-slate-900">{generatedReport.scope}</span>
            </p>
          </div>

          {/* Table display based on chosen audit scope */}
          {reportType === 'inventory' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3">Nama Produk</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Stok Saat Ini</th>
                    <th className="py-2 px-3">Harga Kulakan</th>
                    <th className="py-2 px-3">Total Modal Tertahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-2 px-3">{p.category}</td>
                      <td className="py-2 px-3">{p.stock} {p.unit}</td>
                      <td className="py-2 px-3">Rp{p.purchasePrice.toLocaleString()}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        Rp{(p.stock * p.purchasePrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-3 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 mr-2">Total Estimasi Aset Gudang:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    Rp{products.reduce((acc, curr) => acc + (curr.stock * curr.purchasePrice), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'finance' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3">Waktu</th>
                    <th className="py-2 px-3">Keterangan Jurnal</th>
                    <th className="py-2 px-3">Debit (Rp)</th>
                    <th className="py-2 px-3">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ledger.map(entry => (
                    <tr key={entry.id}>
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{entry.time}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{entry.keterangan}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">
                        {entry.debit ? `Rp${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-bold text-red-700">
                        {entry.kredit ? `Rp${entry.kredit.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'members' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3">ID Anggota</th>
                    <th className="py-2 px-3">Nama Lengkap</th>
                    <th className="py-2 px-3">Simpanan Pokok</th>
                    <th className="py-2 px-3">Simpanan Wajib</th>
                    <th className="py-2 px-3">Simpanan Sukarela</th>
                    <th className="py-2 px-3">Total Deposito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map(m => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-mono text-slate-600">{m.memberId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{m.name}</td>
                      <td className="py-2 px-3">Rp{m.savingsPokok.toLocaleString()}</td>
                      <td className="py-2 px-3">Rp{m.savingsWajib.toLocaleString()}</td>
                      <td className="py-2 px-3">Rp{m.savingsSukarela.toLocaleString()}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        Rp{(m.savingsPokok + m.savingsWajib + m.savingsSukarela).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-3 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 mr-2">Total Seluruh Tabungan Dana Koperasi:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    Rp{members.reduce((acc, curr) => acc + (curr.savingsPokok + curr.savingsWajib + curr.savingsSukarela), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Signoff block */}
          <div className="mt-10 pt-10 border-t border-slate-300 grid grid-cols-2 gap-4 text-xs select-none">
            <div className="text-center">
              <p className="text-slate-400">Pengurus Audit Koperasi,</p>
              <div className="h-12"></div>
              <p className="font-bold text-slate-800 border-b border-slate-300 inline-block px-4 pb-0.5">Admin Koperasi</p>
              <p className="text-[10px] text-slate-400 mt-1">Superadmin SIMKOPDES</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Mengetahui, Kepala Desa Pedes</p>
              <div className="h-12"></div>
              <p className="font-bold text-slate-800 border-b border-slate-300 inline-block px-4 pb-0.5">H. Jaka Suwandi, S.Ip</p>
              <p className="text-[10px] text-slate-400 mt-1">NIP. 197412032002121003</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="enterprise-card p-12 text-center text-[#64748B] select-none">
          <Info className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold">Belum Ada Laporan yang Di-generate</p>
          <p className="text-xs mt-1 text-slate-400">Pilih jenis audit dan periode cakupan di panel atas, kemudian klik "Generate Audited Report".</p>
        </div>
      )}
    </div>
  );
}
