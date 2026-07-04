import React, { useState } from 'react';
import { 
  Server, 
  Settings, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Radio, 
  Database,
  Globe
} from 'lucide-react';

interface InfrastructureTabProps {
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
}

export default function InfrastructureTab({ addLog }: InfrastructureTabProps) {
  // Mock module states
  const [waSocket, setWaSocket] = useState(true);
  const [apiGateway, setApiGateway] = useState(true);
  const [ledgerBroker, setLedgerBroker] = useState(true);
  const [encryptionSecure, setEncryptionSecure] = useState(true);

  const toggleModule = (moduleName: string, state: boolean, setter: (s: boolean) => void) => {
    const nextState = !state;
    setter(nextState);
    if (nextState) {
      addLog(`INFRASTRUCTURE: Commencing initialization sequences for ${moduleName} Gateway...`, 'info');
      setTimeout(() => {
        addLog(`SUCCESS: ${moduleName} service state mapped to ONLINE (Health Checked)`, 'success');
      }, 500);
    } else {
      addLog(`SECURITY WARNING: ${moduleName} service state flagged OFFLINE manually. Inter-cooperative channels compromised.`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-end select-none text-left">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">System Infrastructure &amp; Admin</h1>
          <p className="text-[#64748B] text-sm mt-1">Configure microservices, override API gateway routes, and supervise hardware resource metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gateway Services Controller (Col Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="enterprise-card p-5 text-left select-none">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="w-4.5 h-4.5 text-[#006C49]" />
              <span>Microservices Broker Settings</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                <div className="flex gap-3 items-center">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">WhatsApp Broadcast Webhook Socket</span>
                    <span className="text-[10px] text-slate-500">Pushes automatic flash-sale texts to member queues</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule('WhatsApp Socket', waSocket, setWaSocket)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                    waSocket ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                <div className="flex gap-3 items-center">
                  <Cpu className="w-5 h-5 text-purple-500" />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">API Gateway Routing Broker</span>
                    <span className="text-[10px] text-slate-500">Resolves reverse-proxies and rate-limits requests</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule('API Gateway', apiGateway, setApiGateway)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                    apiGateway ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                <div className="flex gap-3 items-center">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">Double-Entry Ledger Broker Sync</span>
                    <span className="text-[10px] text-slate-500">Commits synchronized assets and liability balances</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule('Ledger Sync Broker', ledgerBroker, setLedgerBroker)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                    ledgerBroker ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                <div className="flex gap-3 items-center">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">Hardware Cryptographic TLS Layer</span>
                    <span className="text-[10px] text-slate-500">Enforces AES-256 state encryption protocols</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule('TLS Encryption Layer', encryptionSecure, setEncryptionSecure)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                    encryptionSecure ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 flex justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* System Diagnostics Metrics (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="enterprise-card p-5 text-left select-none">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4.5 h-4.5 text-[#006C49]" />
              <span>Diagnostic Live Meters</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Server CPU Utilization</span>
                  <span>14.2% (Low Load)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '14.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Memory Stack Allocation</span>
                  <span>42.4 MB / 512 MB</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '8.3%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Database IO Latency</span>
                  <span>12ms (Optimal)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">TLS Certificate</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> SECURED
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Docker Container</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> STABLE
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
