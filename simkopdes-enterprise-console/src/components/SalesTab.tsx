import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  FileText, 
  Sparkles, 
  Printer, 
  X,
  CreditCard,
  User,
  Calendar
} from 'lucide-react';
import { SalesRecord } from '../types';

interface SalesTabProps {
  sales: SalesRecord[];
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function SalesTab({ sales, addLog }: SalesTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<SalesRecord | null>(null);

  // Sales aggregates
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalItemsSold = sales.reduce((acc, curr) => acc + curr.qty, 0);
  const averageTicketSize = Math.round(totalRevenue / sales.length);

  // Pure SVG Area Chart variables
  // 7 days of sales data points
  const chartData = [
    { day: 'Sen', amount: 1200000 },
    { day: 'Sel', amount: 1850000 },
    { day: 'Rab', amount: 1500000 },
    { day: 'Kam', amount: 2400000 },
    { day: 'Jum', amount: 2100000 },
    { day: 'Sab', amount: 3500000 },
    { day: 'Min', amount: 2900000 }
  ];

  const maxChartVal = 4000000;
  const chartWidth = 500;
  const chartHeight = 160;
  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - (d.amount / maxChartVal) * chartHeight;
    return { x, y, day: d.day, amount: d.amount };
  });

  // Build the SVG path string
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const handlePrintInvoice = () => {
    addLog(`PRINT: Spooled invoice #${selectedInvoice?.id} to system printer queues.`, 'success');
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Sales Analytics</h1>
          <p className="text-[#64748B] text-sm mt-1">Monitor cooperative revenue, member sales volume, and transaction history.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006C49]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Total Pendapatan</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalRevenue.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-[#3B82F6]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Barang Terjual</span>
            <span className="text-xl font-bold text-[#0F172A]">{totalItemsSold} <span className="text-xs font-normal text-[#64748B]">Unit</span></span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Rata-rata Transaksi</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{averageTicketSize.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Jumlah Transaksi</span>
            <span className="text-xl font-bold text-[#0F172A]">{sales.length} <span className="text-xs font-normal text-[#64748B]">Kuitansi</span></span>
          </div>
        </div>
      </div>

      {/* Analytics and Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        {/* Sales Trend Chart Card */}
        <div className="lg:col-span-7 enterprise-card p-5 flex flex-col justify-between">
          <div className="text-left mb-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#006C49]" />
              <span>Tren Penjualan Mingguan</span>
            </h3>
            <p className="text-[#64748B] text-xs mt-0.5">Pendapatan harian dalam 7 hari terakhir</p>
          </div>

          {/* Custom Pure-SVG Line Chart with Gradient */}
          <div className="relative h-44 flex items-end">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[1000000, 2000000, 3000000].map((val, i) => {
                const y = chartHeight - (val / maxChartVal) * chartHeight;
                return (
                  <line 
                    key={i} 
                    x1="0" 
                    y1={y} 
                    x2={chartWidth} 
                    y2={y} 
                    stroke="#F1F5F9" 
                    strokeWidth="1" 
                  />
                );
              })}

              {/* Filled Area */}
              <path d={areaPath} fill="url(#chart-grad)" />

              {/* Spline Path */}
              <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" />

              {/* Data circles & value displays */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#FFFFFF" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    className="hover:r-6 transition-all duration-100" 
                  />
                  
                  {/* Subtle Text Display on Hover / Static */}
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    textAnchor="middle" 
                    fill="#475569" 
                    fontSize="9" 
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Rp{(p.amount / 1000000).toFixed(1)}M
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between border-t border-[#E2E8F0] pt-2 px-1 text-[11px] font-bold text-[#64748B]">
            {chartData.map((d, i) => (
              <span key={i}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* Promotions Summary Callout */}
        <div className="lg:col-span-5 p-5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <h4 className="text-sm font-bold text-[#6D28D9]">AI Discount Campaigns</h4>
            </div>
            <p className="text-slate-700 text-xs leading-relaxed mb-4">
              Kampanye diskon otomatis diaktifkan untuk barang-barang stagnant berumur lebih dari 28 hari. Ini secara dramatis mempercepat konversi kas koperasi, menurunkan tingkat penimbunan gudang.
            </p>
            <div className="space-y-2 text-xs text-slate-800">
              <div className="flex justify-between border-b border-[#DDD6FE] pb-1.5">
                <span>Rata-rata Diskon:</span>
                <span className="font-bold text-[#6D28D9]">12.3% MoM</span>
              </div>
              <div className="flex justify-between border-b border-[#DDD6FE] pb-1.5">
                <span>Konversi WhatsApp:</span>
                <span className="font-bold text-[#6D28D9]">72% Efektivitas</span>
              </div>
              <div className="flex justify-between pb-1.5">
                <span>Estimasi Penyelamatan Modal:</span>
                <span className="font-bold text-[#6D28D9]">Rp8.7M Potensial</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white p-2.5 rounded-lg text-center font-semibold text-xs cursor-pointer shadow-sm transition-colors">
            Analisis Detail di AI Hub
          </div>
        </div>
      </div>

      {/* Sales Transactions History */}
      <section className="enterprise-card select-text">
        <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-[#0F172A]">Riwayat Transaksi Anggota</h3>
          <span className="bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold px-2.5 py-1 rounded">
            Live Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm select-text">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-wider select-none">
                <th className="py-3 px-5">ID Invoice</th>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Nama Anggota</th>
                <th className="py-3 px-5">Produk Belanja</th>
                <th className="py-3 px-5 text-center">Qty</th>
                <th className="py-3 px-5">Total Bayar</th>
                <th className="py-3 px-5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] select-text">
              {sales.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-[#1D4ED8]">
                    #{record.id}
                  </td>
                  <td className="py-3 px-5 text-left">{record.date}</td>
                  <td className="py-3 px-5 font-semibold text-[#0F172A] text-left">
                    {record.memberName}
                  </td>
                  <td className="py-3 px-5 text-left">{record.productName}</td>
                  <td className="py-3 px-5 text-center">{record.qty}</td>
                  <td className="py-3 px-5 text-left font-bold text-[#059669]">
                    Rp{record.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-5 text-right select-none">
                    <button
                      onClick={() => {
                        setSelectedInvoice(record);
                        addLog(`LEDGER: Opened transaction receipt invoice #${record.id}`, 'info');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-[#475569] px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    >
                      Buka Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice Receipt Overlay Dialog */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4 select-none">
              <span className="font-mono text-xs font-bold text-[#64748B]">KUITANSI TRANSAKSI KOPERASI</span>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area content */}
            <div className="flex flex-col gap-5 text-left text-sm select-text">
              {/* Branding Header */}
              <div className="text-center select-none">
                <span className="text-3xl">🏛️</span>
                <h4 className="font-bold text-lg text-[#0F172A] mt-1">Koperasi Desa SIMKOPDES</h4>
                <p className="text-[#64748B] text-[11px] uppercase tracking-wider">Superadmin Console Receipt</p>
              </div>

              <div className="border-t border-b border-[#E2E8F0] py-3 space-y-2 select-text">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> ID Invoice:
                  </span>
                  <span className="font-mono font-bold text-[#0F172A]">#{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Cetak:
                  </span>
                  <span className="font-semibold text-[#0F172A]">{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B] flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Pembeli (Anggota):
                  </span>
                  <span className="font-bold text-[#0F172A]">{selectedInvoice.memberName}</span>
                </div>
              </div>

              {/* Product Lines */}
              <div className="space-y-2 select-text">
                <span className="text-xs font-bold text-[#475569] uppercase tracking-wider select-none">Rincian Belanja</span>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-semibold text-[#0F172A]">{selectedInvoice.productName}</div>
                    <div className="text-xs text-[#64748B]">Qty: {selectedInvoice.qty} unit</div>
                  </div>
                  <div className="font-bold text-[#0F172A]">
                    Rp{selectedInvoice.amount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Payment aggregate totals */}
              <div className="space-y-1.5 select-text pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Subtotal:</span>
                  <span className="font-semibold text-[#0F172A]">Rp{selectedInvoice.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Biaya Admin:</span>
                  <span className="font-semibold text-emerald-600">FREE (Anggota Koperasi)</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#E2E8F0] pt-2 font-bold">
                  <span className="text-[#0F172A]">Total Pembayaran:</span>
                  <span className="text-emerald-700">Rp{selectedInvoice.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Stamp and Print CTA actions */}
              <div className="mt-4 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-sm font-semibold cursor-pointer text-center"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="flex-1 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
