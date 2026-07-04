import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  ShoppingBag, 
  MessageSquare,
  Zap,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface AiAnalyticsTabProps {
  products: Product[];
  addLog: (msg: string, type?: 'info' | 'success' | 'error' | 'warning' | 'system') => void;
  openProductForAi?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAnalyticsTab({ products, addLog, openProductForAi }: AiAnalyticsTabProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya Asisten AI SIMKOPDES. Saya di sini untuk membantu Anda mengoptimalkan stok, menganalisis penjualan stagnant, memberikan saran pemasaran WhatsApp, dan meninjau performa keuangan koperasi desa. Ada yang ingin Anda diskusikan hari ini?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Stagnant inventory helper form state
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle preset clicks from openProductForAi triggers
  useEffect(() => {
    if (openProductForAi) {
      const match = products.find(p => p.name === openProductForAi);
      if (match) {
        setSelectedProductId(match.id);
        triggerProductAnalysis(match);
      }
    }
  }, [openProductForAi]);

  // Trigger chat message submission to Express API
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isChatLoading) return;

    if (!textToSend) setInputValue('');

    const updatedMessages = [...messages, { role: 'user', content: text } as Message];
    setMessages(updatedMessages);
    setIsChatLoading(true);
    addLog(`AI: Dispatched chat query context to Gemini API model...`, 'info');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
        addLog(`AI: Response successfully generated.`, 'success');
      } else {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Maaf, saya gagal terhubung ke server AI saat ini. Silakan periksa jaringan Anda atau coba beberapa saat lagi.\n\nDetail: ${err.message || 'Server timeout'}`
      }]);
      addLog(`AI ERROR: Failed to fetch reply. Check server logs.`, 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Analyze Stagnant product campaign
  const triggerProductAnalysis = async (prodOverride?: Product) => {
    const targetId = prodOverride ? prodOverride.id : selectedProductId;
    const targetProduct = products.find(p => p.id === targetId);
    if (!targetProduct) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCopiedDraft(false);
    addLog(`AI: Initiated stale inventory campaign breakdown for '${targetProduct.name}'...`, 'info');

    try {
      const response = await fetch('/api/ai/analyze-stagnant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: targetProduct.name,
          stagnatDays: targetProduct.stagnantDays,
          stock: targetProduct.stock,
          unitPrice: targetProduct.sellingPrice,
          discount: `${targetProduct.discountAI}%`
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAnalysisResult(data);
        addLog(`AI: Completed stagnant stock analysis and copy generating.`, 'success');
      } else {
        throw new Error(data.error || 'Server error.');
      }
    } catch (err: any) {
      console.error(err);
      addLog(`AI ERROR: Failed to analyze product campaigns.`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (!analysisResult?.whatsappDraft) return;
    navigator.clipboard.writeText(analysisResult.whatsappDraft);
    setCopiedDraft(true);
    addLog(`AI: WhatsApp draft template copy verified in clipboard.`, 'success');
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const presetQuestions = [
    'Bagaimana mengelola arus kas agar Sisa Hasil Usaha meningkat?',
    'Buat rekomendasi prioritas diskon untuk Beras stagnant.',
    'Beri saran cara mendaftarkan simpanan wajib secara massal.'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16 animate-fade-in">
      {/* Title Header */}
      <div className="lg:col-span-12 flex justify-between items-end select-none text-left">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">AI Cooperative Intelligence Hub</h1>
          <p className="text-[#64748B] text-sm mt-1">Leverage Gemini AI power to automate member outreach, dissect sales, and formulate inventory strategies.</p>
        </div>
      </div>

      {/* Left Column: Interactive Chat with SIMKOPDES AI (Col Span 7) */}
      <div className="lg:col-span-7 flex flex-col h-[520px] bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {/* Chat Title bar */}
        <div className="bg-[#FAF8FF] px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#8B5CF6]" />
            <div className="text-left">
              <span className="text-xs font-bold text-[#0F172A] block leading-tight">Asisten AI SIMKOPDES</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Gemini 3.5 Active
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              setMessages([
                {
                  role: 'assistant',
                  content: 'Halo! Saya Asisten AI SIMKOPDES. Saya di sini untuk membantu Anda mengoptimalkan stok, menganalisis penjualan stagnant, memberikan saran pemasaran WhatsApp, dan meninjau performa keuangan koperasi desa. Ada yang ingin Anda diskusikan hari ini?'
                }
              ]);
              addLog("AI: Clear conversation memory logs.", "info");
            }}
            className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Chat
          </button>
        </div>

        {/* Chat Bubbles View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m, index) => {
            const isBot = m.role === 'assistant';
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isBot ? 'bg-indigo-50 text-[#8B5CF6]' : 'bg-emerald-50 text-[#006C49]'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  isBot 
                    ? 'bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs' 
                    : 'bg-[#006C49] text-white shadow-xs'
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          
          {isChatLoading && (
            <div className="flex gap-3 mr-auto max-w-[85%] text-left">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#8B5CF6] flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl text-xs italic">
                Sedang berpikir, merumuskan analisa data...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Preset Questions Suggestions */}
        <div className="px-4 pt-2 pb-1 border-t border-[#E2E8F0] bg-white select-none text-left">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Pertanyaan Umum Pengurus:</span>
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isChatLoading}
                className="bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] text-[10px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all border border-slate-200/50 disabled:opacity-50 text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Message Area */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="p-3 border-t border-[#E2E8F0] bg-white flex gap-2 items-center"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isChatLoading}
            placeholder="Ketik pertanyaan untuk AI Koperasi di sini..."
            className="flex-grow px-3.5 py-2 border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#8B5CF6] disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isChatLoading}
            className="w-9 h-9 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Column: AI Stagnant Stock Promo Optimizer (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <section className="enterprise-card p-5 text-left flex flex-col justify-between h-[520px] overflow-y-auto select-none">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-[#0F172A]">AI Promo Copy Generator</h3>
            </div>

            <p className="text-xs text-[#64748B] mb-4">
              Pilih produk stagnant di bawah ini untuk menghasilkan copywriting siaran flash sale WhatsApp yang tertarget dan optimal untuk anggota.
            </p>

            <div className="space-y-4">
              {/* Product selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Pilih Produk Stagnant
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:border-[#8B5CF6] outline-none"
                >
                  {products.filter(p => p.stagnantDays > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} {p.unit} - Stagnan {p.stagnantDays} Hari)
                    </option>
                  ))}
                </select>
              </div>

              {/* Run Campaign analyzer button */}
              <button
                onClick={() => triggerProductAnalysis()}
                disabled={isAnalyzing || products.length === 0}
                className="w-full py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Hasilkan Copywriting Blast AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Campaign Output Results */}
            {analysisResult && (
              <div className="mt-5 space-y-4 border-t border-slate-100 pt-4 max-h-[250px] overflow-y-auto select-text">
                <div className="bg-[#FAF8FF] border border-[#E2E8F0] p-3 rounded-lg">
                  <div className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3" /> Analisis Pemasaran AI:
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed select-text">
                    {analysisResult.analysis}
                  </p>
                </div>

                <div className="relative">
                  <div className="text-[10px] font-bold text-[#006C49] uppercase tracking-wider mb-1.5 select-none">
                    Draf Pesan Siaran WA:
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto select-text select-all">
                    {analysisResult.whatsappDraft}
                  </pre>
                  <button
                    onClick={handleCopyWhatsApp}
                    className="absolute top-8 right-2 bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[9px] font-semibold flex items-center gap-1 select-none cursor-pointer"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
