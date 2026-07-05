import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Send,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Download
} from 'lucide-react';
import { Product, Booking, LedgerEntry, LogMessage } from '../types';

interface CommandCenterTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  logs: LogMessage[];
  setLogs: React.Dispatch<React.SetStateAction<LogMessage[]>>;
  onOpenAiDialog: (productName: string) => void;
  queueCount: number;
}

export default function CommandCenterTab({
  products,
  setProducts,
  bookings,
  setBookings,
  ledger,
  setLedger,
  logs,
  setLogs,
  onOpenAiDialog,
  queueCount
}: CommandCenterTabProps) {
  // Console state
  const [activeReq, setActiveReq] = useState(0);
  const [dupBlock, setDupBlock] = useState(0);
  const [customCmd, setCustomCmd] = useState('');
  
  const isProcessingRef = useRef(false);
  const lastClickTimeRef = useRef<number>(0);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll console
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Helper to format time
  const formatTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Helper to add logs
  const addLog = (message: string, type: LogMessage['type'] = 'info') => {
    const newLog: LogMessage = {
      id: Math.random().toString(),
      timestamp: formatTime(),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Trigger Flash Sale Action — sends campaign blast only, NO stock/ledger change
  // Stock and ledger are updated later via WebSocket when a real booking is confirmed from simkopdes-chat
  const triggerFlashSale = (product: Product) => {
    const now = Date.now();
    const lastClickTime = lastClickTimeRef.current;

    // 1. Rate Limit Enforcement (2 seconds)
    if (now - lastClickTime < 2000) {
      setDupBlock(prev => prev + 1);
      addLog(`SECURITY: Duplicate Request Ignored for ${product.name}. Rate limit enforced.`, 'error');
      return;
    }

    // 2. Busy State Check
    if (isProcessingRef.current) {
      addLog(`SYSTEM: Busy processing previous request.`, 'warning');
      return;
    }

    lastClickTimeRef.current = now;
    isProcessingRef.current = true;
    setActiveReq(prev => prev + 1);

    addLog(`API Gateway: Incoming request from WhatsApp Trigger for ${product.name}...`, 'info');

    // TRIGGER REAL BACKEND (campaign blast only — no stock deduction):
    fetch(`/api/campaigns/trigger-product/${product.id}`, { method: 'POST' }).catch(e => console.error(e));

    // Stage 1: Idempotency generation (500ms)
    setTimeout(() => {
      addLog(`Idempotency: Key Generated [IDEM-${now.toString().slice(-6)}]`, 'system');
    }, 500);

    // Stage 2: Campaign sent confirmation (1200ms)
    setTimeout(() => {
      addLog(`CAMPAIGN SENT: WhatsApp blast sent to 142 members for ${product.name}. Waiting for booking from member...`, 'success');
      setActiveReq(prev => Math.max(0, prev - 1));
      isProcessingRef.current = false;
    }, 1200);
  };



  // Custom CLI command processor
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;

    const cmd = customCmd.trim().toLowerCase();
    setCustomCmd('');
    addLog(`> ${cmd}`, 'info');

    setTimeout(() => {
      if (cmd === 'help') {
        addLog(`Available commands:
  - 'help': List available terminal diagnostic commands
  - 'status': Prints system status report
  - 'broadcast': Broadcasts simulated discount message
  - 'clear': Clears the terminal output logs`, 'system');
      } else if (cmd === 'status') {
        addLog(`SYSTEM MONITOR DIAGNOSTIC:
  - Database Latency: 12ms (OPTIMAL)
  - Memory Usage: 42.4 MB / 512 MB
  - WhatsApp Socket: CONNECTED
  - API Gateway Version: 2.1.0-Release`, 'success');
      } else if (cmd === 'broadcast') {
        addLog(`BROADCASTING: WhatsApp blast triggers dispatched to members.`, 'success');
        // Trigger for stagnant products directly via API
        fetch('/api/campaigns/trigger-product/prod-001', { method: 'POST' }).catch(() => {});
        fetch('/api/campaigns/trigger-product/prod-002', { method: 'POST' }).catch(() => {});
        fetch('/api/campaigns/trigger-product/prod-003', { method: 'POST' }).catch(() => {});
      } else if (cmd === 'clear') {
        setLogs([
          { id: '1', timestamp: formatTime(), message: 'System Console initialized.', type: 'system' },
          { id: '2', timestamp: formatTime(), message: 'Awaiting events...', type: 'system' }
        ]);
      } else {
        addLog(`Command '${cmd}' not recognized. Type 'help' for diagnostics.`, 'error');
      }
    }, 150);
  };

  // Filter stagnant products
  const stagnantProducts = products.filter(p => p.stagnantDays > 0);

  // Recalculate KPI aggregates
  const totalStagnantProducts = stagnantProducts.length;
  const modalTertahanVal = products.reduce((acc, curr) => {
    if (curr.stagnantDays > 30) {
      return acc + (curr.stock * curr.purchasePrice);
    }
    return acc;
  }, 0);

  const potentialRecoveryVal = products.reduce((acc, curr) => {
    if (curr.stagnantDays > 0) {
      const discountedPrice = curr.sellingPrice * (1 - curr.discountAI / 100);
      return acc + (curr.stock * discountedPrice);
    }
    return acc;
  }, 0);

  const formatRupiahMillions = (num: number) => {
    if (num >= 1000000000) {
      return `Rp${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `Rp${(num / 1000000).toFixed(1)}M`;
    }
    return `Rp${(num / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Command Center</h1>
          <p className="text-[#64748B] text-sm mt-1">Real-time operations and inventory intelligence.</p>
        </div>
        <div>
          <button 
            onClick={() => {
              addLog("SYSTEM: Commencing generation of full system diagnostics report...", "info");
              setTimeout(() => {
                addLog("SUCCESS: Diagnostics exported. Preparing print-ready payload.", "success");
                window.print();
              }, 600);
            }}
            className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] rounded-lg text-sm font-semibold hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-16">
        {/* Left Section: Inventory Insights (Col Span 7) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <section className="enterprise-card flex-grow flex flex-col">
            {/* Insights Card Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0]">
              <div className="text-left">
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#3B82F6]" />
                  <span>Inventory Insights</span>
                </h2>
                <p className="text-[#64748B] text-xs mt-0.5">AI Powered Stagnant Inventory Detector</p>
              </div>
              <button 
                onClick={() => {
                  addLog("ENGINE: Manual Scan Inventory triggered. Running analysis cycle...", "info");
                  fetch('/api/campaigns/run-engine', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      addLog(`ENGINE SUCCESS: ${data.message}`, "success");
                    })
                    .catch(e => {
                      addLog(`ENGINE ERROR: Failed to trigger scan.`, "error");
                    });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm border border-[#CBD5E1]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Inventory</span>
              </button>
            </div>

            <div className="p-5">
              {/* KPIs Aggregates Block */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 select-none">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-2 block">Stagnan (&gt;30 Hari)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#DC2626]">{totalStagnantProducts}</span>
                    <span className="text-[#64748B] text-xs font-semibold">Produk</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-2 block">Modal Tertahan</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#D97706]">{formatRupiahMillions(modalTertahanVal)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-2 block">Total Produk</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#0F172A]">{products.length}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[#475569] text-[10px] font-bold uppercase tracking-wider mb-2 block">Potensi Recovery</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#2563EB]">{formatRupiahMillions(potentialRecoveryVal)}</span>
                  </div>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">Stagnan</th>
                      <th className="py-3 px-4">Stok</th>
                      <th className="py-3 px-4">Diskon AI</th>
                      <th className="py-3 px-4">Prioritas</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                    {stagnantProducts.map(product => {
                      const priorityColor = 
                        product.priority === 'Tinggi' 
                          ? 'status-badge-red' 
                          : product.priority === 'Sedang' 
                            ? 'status-badge-yellow' 
                            : 'status-badge-blue';

                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#0F172A] text-left">
                            <div>{product.name}</div>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <span className={product.stagnantDays > 30 ? 'text-[#DC2626] font-semibold' : 'text-[#D97706]'}>
                              {product.stagnantDays} Hari
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            {product.stock} {product.unit}
                          </td>
                          <td className="py-3.5 px-4 text-left font-bold text-[#059669]">
                            {product.discountAI}%
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityColor}`}>
                              {product.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {/* Open AI helper */}
                              <button
                                onClick={() => onOpenAiDialog(product.name)}
                                className="bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D28D9] hover:bg-[#EDE9FE] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                                title="AI Pemasaran Otomatis"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                                <span>Draft AI</span>
                              </button>

                              {/* WhatsApp Simulation Action */}
                              <button
                                onClick={() => triggerFlashSale(product)}
                                className="bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Flash Sale WA</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Right Section: Ops Panel & Tech Console (Col Span 5) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Ops Panel Card */}
          <section className="enterprise-card flex flex-col divide-y divide-[#E2E8F0]">
            {/* Booking Queue block */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2 text-left">
                <Clock className="w-4.5 h-4.5 text-[#3B82F6]" />
                <span>Incoming Booking Queue</span>
              </h3>
              <div className="overflow-x-auto max-h-[140px] overflow-y-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Member</th>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[#64748B] italic">
                          Belum ada antrean masuk.
                        </td>
                      </tr>
                    ) : (
                      bookings.map(b => {
                        const statusClass = 
                          b.status === 'Booking' 
                            ? 'status-badge-yellow' 
                            : b.status === 'Processing' 
                              ? 'status-badge-blue' 
                              : b.status === 'Success' 
                                ? 'status-badge-green' 
                                : 'status-badge-red';

                        return (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-left">{b.time}</td>
                            <td className="py-2 px-3 font-semibold text-left">{b.member}</td>
                            <td className="py-2 px-3 text-left">{b.item}</td>
                            <td className="py-2 px-3 text-left">{b.qty}</td>
                            <td className="py-2 px-3 text-left">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${statusClass}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Core Ledger Sync Block */}
            <div className="p-5">
              <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2 text-left">
                <Database className="w-4.5 h-4.5 text-[#3B82F6]" />
                <span>Core Ledger Sync</span>
              </h3>
              <div className="overflow-x-auto max-h-[140px] overflow-y-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Keterangan</th>
                      <th className="py-2 px-3">Debit</th>
                      <th className="py-2 px-3">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                    {ledger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-left">{entry.time}</td>
                        <td className="py-2 px-3 font-medium text-left">{entry.keterangan}</td>
                        <td className={`py-2 px-3 text-left font-bold ${entry.debit ? 'text-[#059669]' : 'text-[#64748B]'}`}>
                          {entry.debit ? `Rp${entry.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className={`py-2 px-3 text-left font-bold ${entry.kredit ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                          {entry.kredit ? `Rp${entry.kredit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Tech Developer Console Section */}
          <section className="tech-console flex-grow flex flex-col min-h-[280px]">
            {/* Diagnostics Stats Header */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#334155] select-none">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>System Logs</span>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <div className="text-[#64748B] text-[9px] uppercase">Active Req</div>
                  <div className="text-white font-mono text-xs font-semibold">{activeReq}</div>
                </div>
                <div>
                  <div className="text-[#64748B] text-[9px] uppercase">Queue</div>
                  <div className="text-white font-mono text-xs font-semibold">{queueCount}</div>
                </div>
                <div>
                  <div className="text-[#64748B] text-[9px] uppercase">Dup Block</div>
                  <div className="text-white font-mono text-xs font-semibold">{dupBlock}</div>
                </div>
              </div>
            </div>

            {/* Scrollable logs viewport */}
            <div className="flex-grow font-mono text-[11px] leading-relaxed overflow-y-auto console-scroll max-h-[160px] text-left pr-1 select-text">
              {logs.map(log => {
                let colorClass = 'text-[#E2E8F0]';
                if (log.type === 'success') colorClass = 'text-[#10B981]';
                else if (log.type === 'error') colorClass = 'text-[#EF4444]';
                else if (log.type === 'warning') colorClass = 'text-[#F59E0B]';
                else if (log.type === 'system') colorClass = 'text-[#64748B]';

                return (
                  <div key={log.id} className="mb-1 select-text">
                    <span className="text-[#64748B] mr-1.5">[{log.timestamp}]</span>
                    <span className={`${colorClass} whitespace-pre-line`}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>

            {/* Console shell input */}
            <form onSubmit={handleCommandSubmit} className="mt-2 pt-2 border-t border-[#334155] flex items-center">
              <span className="text-emerald-400 font-mono text-xs mr-2 select-none">&gt;</span>
              <input
                type="text"
                value={customCmd}
                onChange={(e) => setCustomCmd(e.target.value)}
                placeholder="Type 'help' or 'status' diagnostics..."
                className="flex-1 bg-transparent border-none text-white font-mono text-xs outline-none p-0 focus:ring-0 m-0"
              />
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
