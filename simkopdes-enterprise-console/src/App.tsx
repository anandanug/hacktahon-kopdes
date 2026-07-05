import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommandCenterTab from './components/CommandCenterTab';
import InventoryTab from './components/InventoryTab';
import SalesTab from './components/SalesTab';
import MembersTab from './components/MembersTab';
import FinanceTab from './components/FinanceTab';
import AiAnalyticsTab from './components/AiAnalyticsTab';
import ReportsTab from './components/ReportsTab';
import InfrastructureTab from './components/InfrastructureTab';
import LoyaltyTab from './components/LoyaltyTab';
import { Product, Booking, LedgerEntry, Member, LogMessage, SalesRecord } from './types';
import { Sparkles, X, Check, HelpCircle, AlertCircle, RefreshCw, Send, DollarSign } from 'lucide-react';

export default function App() {
  // Navigation active state
  const [currentTab, setCurrentTab] = useState('command-center');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic AI Dialog pre-selection trigger
  const [selectedProductForAi, setSelectedProductForAi] = useState<string | null>(null);

  // General Interactive overlay modals
  const [showSparklesModal, setShowSparklesModal] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);

  // Global State Definitions with realistic cooperative datasets
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'prod-001',
      name: 'Beras Pandanwangi 5kg',
      category: 'Sembako',
      stagnantDays: 32,
      stock: 150,
      unit: 'Karung',
      purchasePrice: 52000,
      sellingPrice: 60000,
      discountAI: 10,
      priority: 'Tinggi'
    },
    {
      id: 'prod-002',
      name: 'Minyak Goreng',
      category: 'Minyak & Lemak',
      stagnantDays: 28,
      stock: 80,
      unit: 'Dus',
      purchasePrice: 38000,
      sellingPrice: 45000,
      discountAI: 15,
      priority: 'Sedang'
    },
    {
      id: 'prod-003',
      name: 'Gula Pasir',
      category: 'Sembako',
      stagnantDays: 35,
      stock: 120,
      unit: 'Karung',
      purchasePrice: 10500,
      sellingPrice: 12000,
      discountAI: 12,
      priority: 'Tinggi'
    },
    {
      id: 'prod-004',
      name: 'Tepung Terigu Segitiga Biru',
      category: 'Bumbu Dapur',
      stagnantDays: 0,
      stock: 200,
      unit: 'Pcs',
      purchasePrice: 11000,
      sellingPrice: 13000,
      discountAI: 0,
      priority: 'Rendah'
    },
    {
      id: 'prod-005',
      name: 'Sabun Cair Cuci Piring',
      category: 'Kebutuhan Rumah',
      stagnantDays: 0,
      stock: 45,
      unit: 'Dus',
      purchasePrice: 14000,
      sellingPrice: 16500,
      discountAI: 5,
      priority: 'Rendah'
    }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([]);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: 'ledger-init',
      time: '09:00:00',
      keterangan: 'Saldo Awal Kas Koperasi',
      debit: null,
      kredit: null
    }
  ]);

  const [members, setMembers] = useState<Member[]>([
    {
      id: 'mem-1',
      name: 'Budi Hartono',
      memberId: 'SB-001',
      savingsPokok: 100000,
      savingsWajib: 150000,
      savingsSukarela: 60000,
      activeStatus: true,
      joinedDate: 'Jan 12, 2024'
    },
    {
      id: 'mem-2',
      name: 'Siti Aminah',
      memberId: 'SB-002',
      savingsPokok: 100000,
      savingsWajib: 200000,
      savingsSukarela: 45000,
      activeStatus: true,
      joinedDate: 'Peb 05, 2024'
    },
    {
      id: 'mem-3',
      name: 'Andi Wijaya',
      memberId: 'SB-003',
      savingsPokok: 100000,
      savingsWajib: 100000,
      savingsSukarela: 15000,
      activeStatus: true,
      joinedDate: 'Mar 18, 2024'
    },
    {
      id: 'mem-4',
      name: 'Yusuf Mansur',
      memberId: 'SB-004',
      savingsPokok: 100000,
      savingsWajib: 50000,
      savingsSukarela: 0,
      activeStatus: false,
      joinedDate: 'Mei 22, 2024'
    }
  ]);

  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: 'log-1',
      timestamp: '09:00:00',
      message: 'Enterprise Console initialized.',
      type: 'system'
    },
    {
      id: 'log-2',
      timestamp: '09:00:02',
      message: 'Awaiting events...',
      type: 'system'
    }
  ]);

  const [sales, setSales] = useState<SalesRecord[]>([
    {
      id: '81023',
      date: '04/07/2026',
      productName: 'Beras Pandanwangi 5kg',
      qty: 2,
      amount: 120000,
      memberName: 'Budi Hartono'
    },
    {
      id: '81022',
      date: '03/07/2026',
      productName: 'Minyak Goreng',
      qty: 1,
      amount: 45000,
      memberName: 'Siti Aminah'
    },
    {
      id: '81021',
      date: '02/07/2026',
      productName: 'Gula Pasir',
      qty: 3,
      amount: 36000,
      memberName: 'Andi Wijaya'
    }
  ]);

  // Global log dispatcher
  const addLog = (message: string, type: LogMessage['type'] = 'info') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: LogMessage = {
      id: Math.random().toString(),
      timestamp: timeStr,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Real-time backend WS synchronization
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8000/ws/dashboard");

      ws.onopen = () => {
        console.log('[Enterprise] Global Dashboard WS connected');
        addLog('[SYSTEM] Sinkronisasi real-time terhubung ke backend.', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.event === 'booking_status_changed') {
            const booking = payload.data;
            if (!booking) return;

            const bookingId = booking.id;
            const productId = booking.product_id;
            const productName = booking.product_name || 'Unknown';
            const quantity = booking.quantity || 1;
            const status = booking.status;
            
            const currentTime = new Date().toLocaleTimeString('id-ID', { hour12: false });

            let displayStatus: 'Booking' | 'Processing' | 'Success' | 'Failed' = 'Booking';
            if (status === 'Queued') displayStatus = 'Booking';
            else if (status === 'Processing') displayStatus = 'Processing';
            else if (status === 'Confirmed') displayStatus = 'Success';
            else if (status === 'Failed' || status === 'Cancelled') displayStatus = 'Failed';

            setBookings(prev => {
              const exists = prev.some(b => b.id === bookingId);
              if (exists) {
                return prev.map(b => b.id === bookingId ? { ...b, status: displayStatus } : b);
              } else {
                return [
                  {
                    id: bookingId,
                    time: currentTime,
                    member: booking.member_name || 'Anggota',
                    item: productName,
                    qty: quantity,
                    status: displayStatus
                  },
                  ...prev
                ];
              }
            });

            if (status === 'Queued') {
              addLog(`FIFO Queue: Posisi antrean didapatkan untuk booking [${booking.booking_code || 'BK'}].`, 'info');
            } else if (status === 'Processing') {
              addLog(`PROCESSING: Memproses booking [${booking.booking_code || 'BK'}] - memverifikasi stok.`, 'info');
            } else if (status === 'Confirmed') {
              setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                  const nextStock = Math.max(0, p.stock - quantity);
                  return { ...p, stock: nextStock };
                }
                return p;
              }));

              const matchedProduct = productsRef.current.find(p => p.id === productId);
              const unitValue = matchedProduct
                ? Math.round(matchedProduct.sellingPrice * (1 - matchedProduct.discountAI / 100))
                : booking.unit_price || booking.total_price || 0;

              const debitEntry: LedgerEntry = {
                id: `ledger-deb-${Date.now()}`,
                time: currentTime,
                keterangan: `Kas Koperasi (Penjualan ${productName})`,
                debit: unitValue * quantity,
                kredit: null
              };
              const creditEntry: LedgerEntry = {
                id: `ledger-cred-${Date.now() + 1}`,
                time: currentTime,
                keterangan: `Persediaan ${productName}`,
                debit: null,
                kredit: unitValue * quantity
              };
              setLedger(prev => [debitEntry, creditEntry, ...prev]);

              // Update sales records dynamically
              const now = new Date();
              const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
              const newSale: SalesRecord = {
                id: booking.booking_code || `sale-${Date.now()}`,
                date: dateStr,
                productName: productName,
                qty: quantity,
                amount: unitValue * quantity,
                memberName: booking.member_name || 'Anggota'
              };
              setSales(prev => [newSale, ...prev]);

              addLog(`SUCCESS: Booking [${booking.booking_code || 'BK'}] terkonfirmasi. Stok berkurang. Jurnal umum disinkronkan.`, 'success');
            } else if (status === 'Failed') {
              addLog(`FAILED: Booking [${booking.booking_code || 'BK'}] gagal diproses - stok tidak tersedia atau konflik.`, 'error');
            }
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      ws.onclose = () => {
        console.log('[Enterprise] Global Dashboard WS disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (ws) ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  // Deposit savings dispatcher (triggered from members screen)
  const handleRecordDeposit = (member: Member, amount: number, type: 'Wajib' | 'Sukarela') => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('id-ID', { hour12: false });

    // Update member saving state balances
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        if (type === 'Wajib') {
          return { ...m, savingsWajib: m.savingsWajib + amount };
        } else {
          return { ...m, savingsSukarela: m.savingsSukarela + amount };
        }
      }
      return m;
    }));

    // Record Debit journal entry
    const debitEntry: LedgerEntry = {
      id: `ledger-deb-sav-${Date.now()}`,
      time: currentTime,
      keterangan: `Kas Koperasi (Setoran Simpanan ${type} - ${member.name})`,
      debit: amount,
      kredit: null
    };

    // Record Credit Journal entry
    const creditEntry: LedgerEntry = {
      id: `ledger-cred-sav-${Date.now() + 1}`,
      time: currentTime,
      keterangan: `Simpanan Anggota (${member.name})`,
      debit: null,
      kredit: amount
    };

    setLedger(prev => [debitEntry, creditEntry, ...prev]);
    addLog(`SUCCESS: Recorded simpanan ${type} payment from ${member.name} for Rp${amount.toLocaleString()}. Ledger synced.`, 'success');
  };

  // Switch to AI promotional copywriter screen helper
  const handleOpenProductForAi = (productName: string) => {
    setSelectedProductForAi(productName);
    setCurrentTab('ai-analytics');
    addLog(`NAVIGATE: Redirected to AI Hub with pre-selected stale item '${productName}'.`, 'info');
  };

  // Count active stagnant products
  const stagnantCount = products.filter(p => p.stagnantDays > 0).length;

  // Active bookings queue
  const pendingQueueCount = bookings.filter(b => b.status === 'Booking' || b.status === 'Processing').length;

  return (
    <div id="app-root-wrapper" className="font-sans overflow-hidden h-screen flex bg-[#F8FAFC]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={(tab) => {
          setCurrentTab(tab);
          addLog(`NAVIGATE: Switched view screen to '${tab}'`, 'system');
        }} 
        stagnantCount={stagnantCount} 
      />

      {/* Main Container Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* 2. Top Header Navigation */}
        <Header 
          onSearchChange={setSearchQuery} 
          onSparklesClick={() => {
            setShowSparklesModal(true);
            addLog("AI: Clicked AI Sparkles recommendation summary hub.", "info");
          }} 
          queueCount={pendingQueueCount} 
        />

        {/* 3. Global Real-time Connectivity Status Bar */}
        <div className="h-10 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-6 flex-shrink-0 text-xs font-semibold text-[#475569] overflow-x-auto shadow-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse-dot"></span>
            <span>AI Engine: <span className="text-[#0F172A] font-bold">Active</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>WhatsApp: <span className="text-[#0F172A] font-bold">Connected</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>API Gateway: <span className="text-[#0F172A] font-bold">Healthy</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>Ledger: <span className="text-[#0F172A] font-bold">Synced</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
            <span>Queue: <span className="text-[#0F172A] font-bold">{pendingQueueCount} pending</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>Database: <span className="text-[#0F172A] font-bold">12ms</span></span>
          </div>
        </div>

        {/* 4. Scrollable Dynamic Sub-Tab Content viewport */}
        <main id="main-scrollable-content" className="flex-1 overflow-auto p-6">
          {currentTab === 'command-center' && (
            <CommandCenterTab 
              products={products} 
              setProducts={setProducts} 
              bookings={bookings} 
              setBookings={setBookings} 
              ledger={ledger} 
              setLedger={setLedger} 
              logs={logs} 
              setLogs={setLogs} 
              onOpenAiDialog={handleOpenProductForAi} 
              queueCount={pendingQueueCount}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryTab 
              products={products} 
              setProducts={setProducts} 
              onOpenAiDialog={handleOpenProductForAi} 
              addLog={addLog} 
            />
          )}

          {currentTab === 'sales' && (
            <SalesTab 
              sales={sales} 
              addLog={addLog} 
            />
          )}

          {currentTab === 'members' && (
            <MembersTab 
              members={members} 
              setMembers={setMembers} 
              addLog={addLog} 
              onRecordDeposit={handleRecordDeposit} 
            />
          )}

          {currentTab === 'finance' && (
            <FinanceTab 
              ledger={ledger} 
              setLedger={setLedger} 
              addLog={addLog} 
            />
          )}

          {currentTab === 'ai-analytics' && (
            <AiAnalyticsTab 
              products={products} 
              addLog={addLog} 
              openProductForAi={selectedProductForAi} 
            />
          )}

          {currentTab === 'reports' && (
            <ReportsTab 
              products={products} 
              ledger={ledger} 
              members={members} 
              addLog={addLog} 
            />
          )}

          {currentTab === 'loyalty' && (
            <LoyaltyTab 
              members={members} 
              ledger={ledger} 
              addLog={addLog} 
            />
          )}

          {currentTab === 'infrastructure' && (
            <InfrastructureTab 
              addLog={addLog} 
            />
          )}

          {currentTab === 'administration' && (
            <div className="enterprise-card p-8 text-center text-[#64748B] select-none">
              <h2 className="text-lg font-bold text-[#0F172A] mb-2">Administration Configuration Settings</h2>
              <p className="text-xs max-w-md mx-auto mb-4">
                Ubah parameter sistem global, reset cache basis data, sinkronisasi kunci otentikasi API pihak ketiga, dan kelola otentikasi admin.
              </p>
              <div className="flex gap-3 justify-center select-none">
                <button 
                  onClick={() => {
                    addLog("ADMINISTRATION: Purged microservices operational cache blocks.", "warning");
                    alert("Cache Sistem Berhasil Dibersihkan!");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Clear System Cache
                </button>
                <button 
                  onClick={() => {
                    addLog("ADMINISTRATION: Synced local configurations with Cloud Run services.", "success");
                    alert("Konfigurasi Berhasil Disinkronkan!");
                  }}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Sync Cloud Run Config
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 5. Floating Quick Action Overlay (Bolt icon at bottom right) */}
      <div className="fixed bottom-6 right-6 z-40 group select-none">
        {showQuickActionMenu && (
          <div className="absolute bottom-full right-0 mb-3 flex flex-col gap-2 min-w-[170px] animate-fade-in">
            <button 
              onClick={() => {
                setCurrentTab('ai-analytics');
                setShowQuickActionMenu(false);
                addLog("NAVIGATE: Redirected to AI Promotion blasting.", "info");
              }}
              className="bg-white px-4 py-2 rounded-lg shadow-md border border-[#E2E8F0] text-xs text-[#0F172A] font-bold hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
            >
              <span>New Broadcast</span>
              <span className="text-[#8B5CF6] font-bold text-[10px]">WA</span>
            </button>
            <button 
              onClick={() => {
                setCurrentTab('inventory');
                setShowQuickActionMenu(false);
                addLog("NAVIGATE: Redirected to Inventory management.", "info");
              }}
              className="bg-white px-4 py-2 rounded-lg shadow-md border border-[#E2E8F0] text-xs text-[#0F172A] font-bold hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
            >
              <span>Add Product</span>
              <span className="text-[#006C49] font-bold text-[10px]">STOCK</span>
            </button>
            <button 
              onClick={() => {
                setCurrentTab('finance');
                setShowQuickActionMenu(false);
                addLog("NAVIGATE: Redirected to Manual double ledger entry.", "info");
              }}
              className="bg-white px-4 py-2 rounded-lg shadow-md border border-[#E2E8F0] text-xs text-[#0F172A] font-bold hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
            >
              <span>Manual Entry</span>
              <span className="text-slate-500 font-bold text-[10px]">LEDGER</span>
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
          className="w-14 h-14 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer active:scale-95"
        >
          <span className="text-white font-bold text-2xl">⚡</span>
        </button>
      </div>

      {/* AI Sparkles Dialog Recommendation Modal Overlay */}
      {showSparklesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md p-6 text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4 select-none">
              <span className="text-xs font-bold text-[#6D28D9] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI SPARKLES REKENDASI DESA
              </span>
              <button 
                onClick={() => setShowSparklesModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sparkles list of tips */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl">🏛️✨</span>
                <h4 className="font-extrabold text-base text-[#0F172A] mt-2">SIMKOPDES Mission Control Tips</h4>
                <p className="text-[#64748B] text-xs mt-1">Status dan optimasi koperasi terdeteksi oleh AI</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-red-950 block">Optimasi Beras Pandanwangi</span>
                    <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                      Beras Pandanwangi mengendap selama 32 hari. Jalankan program Flash Sale WA dengan diskon 10% untuk menaikkan perputaran kas sebesar Rp1.2M.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex gap-3">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Neraca Balanced &amp; Sehat</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      Aliran pencatatan ledger berada pada status sinkronisasi penuh (0ms audit skew). Arus simpanan wajib naik 14% MoM meningkatkan likuiditas kas.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-950 block">Pemberitahuan Tagihan Anggota</span>
                    <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                      AI mendeteksi 1 anggota (SB-004) dengan simpanan wajib tertunda. Kirim tagihan personal via blast WA otomatis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSparklesModal(false)}
                  className="flex-1 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSparklesModal(false);
                    setCurrentTab('ai-analytics');
                    addLog("AI: Redirected to AI Assistant Hub.", "info");
                  }}
                  className="flex-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-semibold cursor-pointer text-center shadow-md flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buka Chat AI Hub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
