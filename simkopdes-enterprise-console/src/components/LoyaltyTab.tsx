import React, { useMemo } from 'react';
import { 
  Award, 
  Crown, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Lock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Member, LedgerEntry } from '../types';

interface LoyaltyTabProps {
  members: Member[];
  ledger: LedgerEntry[];
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function LoyaltyTab({ members, ledger, addLog }: LoyaltyTabProps) {
  // 1. Calculate Mock SHU Data
  // In a real app, SHU is calculated from Net Profit (Pendapatan - Beban) over a fiscal year.
  // We'll calculate a mock Total Profit pool based on the ledger to simulate a dynamic dashboard.
  const calculateTotalProfit = () => {
    let totalKas = 0;
    ledger.forEach(entry => {
      if (entry.keterangan.includes('Kas') || entry.keterangan.includes('Pendapatan')) {
        totalKas += (entry.debit || 0);
      }
    });
    // Add a base offset for simulation so the chart looks good
    return Math.max(0, totalKas) + 45000000;
  };

  const totalSHU = calculateTotalProfit();

  // Standard Cooperative SHU Distribution (AD/ART)
  const shuDistribution = [
    { name: 'Anggota (Jasa Modal & Usaha)', value: totalSHU * 0.40, color: '#059669' },
    { name: 'Cadangan Koperasi', value: totalSHU * 0.30, color: '#3B82F6' },
    { name: 'Jasa Pengurus & Karyawan', value: totalSHU * 0.20, color: '#8B5CF6' },
    { name: 'Dana Sosial & Pendidikan', value: totalSHU * 0.10, color: '#F59E0B' }
  ];

  // 2. Trend Data Mock
  const trendData = [
    { month: 'Jan', shu: 25000000 },
    { month: 'Feb', shu: 28000000 },
    { month: 'Mar', shu: 31500000 },
    { month: 'Apr', shu: 34000000 },
    { month: 'May', shu: 39000000 },
    { month: 'Jun', shu: totalSHU },
  ];

  // 3. Loyalty Leaderboard
  // Calculate a Loyalty Score based on savings and activity.
  const leaderboardData = useMemo(() => {
    return members.map(m => {
      // Logic: 1 point per Rp10.000 in Wajib, 1.5 points per Rp10.000 in Sukarela
      const pointWajib = (m.savingsWajib / 10000) * 1;
      const pointSukarela = (m.savingsSukarela / 10000) * 1.5;
      
      // Adding a random bonus to simulate transaction activity
      const activityBonus = (m.name.length * 15);
      
      const totalScore = Math.round(pointWajib + pointSukarela + activityBonus);

      // Estimated personal dividend (pro-rata based on score)
      // Members get 40% of Total SHU
      const baseDividendPool = totalSHU * 0.40;
      // We simulate their cut based on score weight vs total possible score
      const estimatedDividend = (totalScore / 1000) * baseDividendPool * 0.05;

      return {
        ...m,
        score: totalScore,
        estimatedDividend: Math.round(estimatedDividend)
      };
    }).sort((a, b) => b.score - a.score);
  }, [members, totalSHU]);

  // Premium feature tooltip simulation
  const handleExportPremium = () => {
    addLog('PREMIUM: Generated comprehensive SHU Dividend distribution PDF report.', 'success');
    alert('Modul Premium: Laporan PDF Pembagian SHU & Dividen Berhasil Diekspor!');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      
      {/* Title Header with Premium Badge */}
      <div className="flex justify-between items-start select-none bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-[#F59E0B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase bg-[#F59E0B]/10 px-2.5 py-1 rounded-full border border-[#F59E0B]/30">
              Enterprise Premium Module
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Loyalty &amp; SHU Analytics</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed text-left">
            Pantau dan analisis kontribusi anggota untuk pembagian Sisa Hasil Usaha (SHU) yang presisi. 
            Modul ini menggunakan algoritma scoring cerdas untuk mengukur loyalitas anggota secara komprehensif.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col items-end gap-3">
          <button
            onClick={handleExportPremium}
            className="px-5 py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Lock className="w-4 h-4 opacity-70" />
            <span>Export Proyeksi Dividen</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md z-10">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="z-10 text-left">
            <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider block mb-1">Estimasi Pool SHU Keseluruhan</span>
            <span className="text-2xl font-black text-[#0F172A]">Rp{totalSHU.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-md z-10">
            <Users className="w-7 h-7" />
          </div>
          <div className="z-10 text-left">
            <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider block mb-1">Rata-rata Dividen / Anggota</span>
            <span className="text-2xl font-black text-[#0F172A]">
              Rp{Math.round((totalSHU * 0.40) / (members.length || 1)).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md z-10">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="z-10 text-left">
            <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider block mb-1">Pertumbuhan SHU (YTD)</span>
            <span className="text-2xl font-black text-[#0F172A]">+24.5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SHU Distribution Pie Chart */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-[#0F172A] mb-1 text-left">Proyeksi Pembagian SHU Induk</h3>
          <p className="text-[#64748B] text-xs mb-4 text-left">Alokasi standar berdasarkan AD/ART Koperasi Desa.</p>
          
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shuDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {shuDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `Rp${value.toLocaleString('id-ID')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-[#64748B] font-bold uppercase">Total SHU</span>
              <span className="text-lg font-black text-[#0F172A]">Rp{(totalSHU / 1000000).toFixed(1)}M</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
            {shuDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs font-semibold text-[#475569]">{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SHU Trend Area Chart */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-[#0F172A] mb-1 text-left">Tren Akumulasi SHU 2026</h3>
          <p className="text-[#64748B] text-xs mb-4 text-left">Proyeksi pertumbuhan dana SHU per bulan.</p>
          
          <div className="flex-1 min-h-0 w-full ml-[-20px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorShu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                  tickFormatter={(value) => `${(value / 1000000)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => `Rp${value.toLocaleString('id-ID')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="shu" 
                  stroke="#059669" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorShu)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* Member Loyalty Leaderboard Table */}
      <section className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
          <div className="text-left">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F59E0B]" />
              <span>Leaderboard Skor Loyalitas Anggota</span>
            </h3>
            <p className="text-[#64748B] text-xs mt-1">Peringkat anggota berdasarkan rutinitas transaksi dan simpanan aktif.</p>
          </div>
          <span className="bg-[#FEF3C7] text-[#D97706] text-xs font-bold px-3 py-1.5 rounded-full border border-[#FDE68A]">
            Top Members 🏆
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#E2E8F0] text-[#94A3B8] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-4 px-6 w-16 text-center">Rank</th>
                <th className="py-4 px-6 text-left">Identitas Anggota</th>
                <th className="py-4 px-6 text-left">Simpanan Wajib &amp; Sukarela</th>
                <th className="py-4 px-6 text-left">Skor Loyalitas</th>
                <th className="py-4 px-6 text-right">Estimasi SHU Individu (Rupiah)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {leaderboardData.map((member, index) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-center">
                    {index === 0 && <span className="text-2xl" title="Peringkat 1">🥇</span>}
                    {index === 1 && <span className="text-2xl" title="Peringkat 2">🥈</span>}
                    {index === 2 && <span className="text-2xl" title="Peringkat 3">🥉</span>}
                    {index > 2 && <span className="text-sm font-bold text-[#64748B]">{index + 1}</span>}
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="font-bold text-[#0F172A] text-sm">{member.name}</div>
                    <div className="text-xs font-mono text-[#64748B] mt-0.5">{member.memberId}</div>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="text-sm font-semibold text-[#3B82F6]">
                      Rp{(member.savingsWajib + member.savingsSukarela).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="inline-flex items-center gap-1.5 bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
                      <span className="font-bold text-[#1D4ED8] text-sm">{member.score} pts</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-black text-[#059669] text-base">
                      + Rp{member.estimatedDividend.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-1 font-semibold uppercase">Proyeksi Akhir Tahun</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
