import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  DollarSign, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Clock 
} from 'lucide-react';
import { Member } from '../types';

interface MembersTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
  onRecordDeposit: (member: Member, amount: number, type: 'Wajib' | 'Sukarela') => void;
}

export default function MembersTab({
  members,
  setMembers,
  addLog,
  onRecordDeposit
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Member Form State
  const [newName, setNewName] = useState('');
  const [newPokok, setNewPokok] = useState(100000);
  const [newWajib, setNewWajib] = useState(50000);
  const [newSukarela, setNewSukarela] = useState(10000);

  // Deposit transaction state for existing members
  const [selectedDepositMember, setSelectedDepositMember] = useState<Member | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [depositType, setDepositType] = useState<'Wajib' | 'Sukarela'>('Wajib');

  // Submit hander to register a new cooperative member
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextIdNumber = members.length + 1;
    const memberId = `SB-${nextIdNumber.toString().padStart(3, '0')}`;

    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: newName,
      memberId: memberId,
      savingsPokok: newPokok,
      savingsWajib: newWajib,
      savingsSukarela: newSukarela,
      activeStatus: true,
      joinedDate: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    setMembers(prev => [...prev, newMember]);
    addLog(`SUCCESS: Registered new cooperative member '${newName}' with ID ${memberId}.`, 'success');

    // Reset Form state
    setNewName('');
    setNewPokok(100000);
    setNewWajib(50000);
    setNewSukarela(10000);
    setShowAddModal(false);
  };

  // Submit handler to add manual deposits
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositMember) return;

    onRecordDeposit(selectedDepositMember, depositAmount, depositType);
    setSelectedDepositMember(null);
  };

  const toggleMemberStatus = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = !m.activeStatus;
        addLog(`MEMBERS: Toggled status of member '${m.name}' to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`, 'warning');
        return { ...m, activeStatus: nextStatus };
      }
      return m;
    }));
  };

  // Search filter matching
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Totals calculating
  const totalSavingsPokok = members.reduce((acc, curr) => acc + curr.savingsPokok, 0);
  const totalSavingsWajib = members.reduce((acc, curr) => acc + curr.savingsWajib, 0);
  const totalSavingsSukarela = members.reduce((acc, curr) => acc + curr.savingsSukarela, 0);
  const totalAllSavings = totalSavingsPokok + totalSavingsWajib + totalSavingsSukarela;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Members Directory</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage cooperative membership accounts, register newcomers, and track savings pools.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Member</span>
        </button>
      </div>

      {/* Aggregate savings metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006C49]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Total Anggota</span>
            <span className="text-xl font-bold text-[#0F172A]">{members.length} <span className="text-xs font-normal text-[#64748B]">Orang</span></span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-[#3B82F6]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Simpanan Pokok Pool</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalSavingsPokok.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Simpanan Wajib Pool</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalSavingsWajib.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider block">Simpanan Sukarela Pool</span>
            <span className="text-xl font-bold text-[#0F172A]">Rp{totalSavingsSukarela.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Filter Action Bar */}
      <div className="bg-white p-4 border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
        <div className="text-left">
          <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Total Kas Terkumpul dari Simpanan: </span>
          <span className="text-sm font-bold text-[#006C49] ml-1">Rp{totalAllSavings.toLocaleString('id-ID')}</span>
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-[#CBD5E1] rounded-lg text-xs focus:bg-white focus:border-[#006C49] focus:ring-1 focus:ring-[#006C49] outline-none transition-all"
            placeholder="Cari nama atau ID anggota..."
          />
        </div>
      </div>

      {/* Main Members Directory table */}
      <section className="enterprise-card select-text">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm select-text">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-xs uppercase tracking-wider select-none">
                <th className="py-3 px-5">ID Anggota</th>
                <th className="py-3 px-5">Nama Lengkap</th>
                <th className="py-3 px-5">Simpanan Pokok</th>
                <th className="py-3 px-5">Simpanan Wajib</th>
                <th className="py-3 px-5">Simpanan Sukarela</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Tanggal Gabung</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] select-text">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748B] italic select-none">
                    Belum ada anggota terdaftar yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-[#1D4ED8]">
                      {member.memberId}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#0F172A] text-left">
                      {member.name}
                    </td>
                    <td className="py-3.5 px-5 text-left font-medium">
                      Rp{member.savingsPokok.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 text-left font-medium">
                      Rp{member.savingsWajib.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 text-left font-medium">
                      Rp{member.savingsSukarela.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 text-left select-none">
                      <button
                        onClick={() => toggleMemberStatus(member.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          member.activeStatus 
                            ? 'bg-[#F0FDF4] text-[#166534] border border-[#86EFAC]'
                            : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]'
                        }`}
                      >
                        {member.activeStatus ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>Blokir</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-left text-xs text-[#64748B]">
                      {member.joinedDate}
                    </td>
                    <td className="py-3.5 px-5 text-right select-none">
                      <button
                        onClick={() => setSelectedDepositMember(member)}
                        className="bg-[#006C49] hover:bg-[#005236] text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ml-auto shadow-xs active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Setor Simpanan</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registration Modal Dialog Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 text-left">
              Pendaftaran Anggota Baru Koperasi
            </h3>

            <form onSubmit={handleRegisterMember} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Nama Lengkap Anggota
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Muhammad Yusuf"
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Setoran Simpanan Pokok (Bayar Sekali saat Daftar)
                </label>
                <input
                  type="number"
                  min="10000"
                  required
                  value={newPokok}
                  onChange={(e) => setNewPokok(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Simpanan Wajib Awal
                  </label>
                  <input
                    type="number"
                    min="5000"
                    required
                    value={newWajib}
                    onChange={(e) => setNewWajib(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Simpanan Sukarela Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newSukarela}
                    onChange={(e) => setNewSukarela(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
                >
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setor Simpanan Modal Overlay Dialog */}
      {selectedDepositMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-xs select-none">
          <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 text-left">
              Setoran Tabungan Simpanan
            </h3>

            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4 text-left">
              <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
                <div className="text-xs text-[#64748B]">Nama Anggota / ID:</div>
                <div className="font-bold text-[#0F172A] text-sm mt-0.5">
                  {selectedDepositMember.name} ({selectedDepositMember.memberId})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Jenis Setoran Simpanan
                </label>
                <select
                  value={depositType}
                  onChange={(e) => setDepositType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                >
                  <option value="Wajib">Simpanan Wajib Bulanan</option>
                  <option value="Sukarela">Simpanan Sukarela Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Jumlah Setoran Tunai (Rp)
                </label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-sm focus:border-[#006C49] outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedDepositMember(null)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006C49] hover:bg-[#005236] text-white rounded-lg text-sm font-semibold cursor-pointer shadow-md"
                >
                  Kirim Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
