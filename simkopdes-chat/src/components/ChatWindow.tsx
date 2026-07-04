import React, { useState, useRef, useEffect } from "react";
import { Contact, Message } from "../types";
import { Send, Smile, Paperclip, Mic, Phone, Video, Search, MoreVertical, ShieldAlert, X } from "lucide-react";

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBeliPromo: () => void;
  isBeliLoading: boolean;
}

export default function ChatWindow({
  contact,
  messages,
  onSendMessage,
  onBeliPromo,
  isBeliLoading,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [isCalling, setIsCalling] = useState<"audio" | "video" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, contact.status]);

  // Audio recording timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleMicClick = () => {
    if (isRecording) {
      // Send simulated audio message
      const audioDuration = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, "0")}`;
      onSendMessage(`🎤 Pesan Suara (${audioDuration})`);
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex-1 flex flex-col h-screen min-w-0 bg-[#f9f9f9] relative" style={{ marginLeft: "clamp(350px, 30%, 450px)" }}>
      {/* Top Header */}
      <header className="flex justify-between items-center h-16 px-4 w-full bg-[#f3f3f4] border-b border-[#bccac2]/40 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer">
          <img 
            className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100" 
            src={contact.avatarUrl} 
            alt={contact.name}
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-sans text-sm font-semibold text-[#1a1c1c]">
              {contact.name}
            </span>
            <span className={`font-sans text-[11px] ${contact.status === "Typing..." ? "text-primary font-semibold" : "text-[#3d4a44]"}`}>
              {contact.status === "Typing..." ? "Mengetik..." : contact.status}
            </span>
          </div>
        </div>

        {/* Media Call & Info Controls */}
        <div className="flex items-center gap-1">
          <button 
            id="chat-search-btn"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#bccac2]/30 active:scale-90 transition-all"
            title="Cari pesan"
          >
            <Search size={18} />
          </button>
          <button 
            id="chat-video-btn"
            onClick={() => setIsCalling("video")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#006b53] hover:bg-[#bccac2]/30 active:scale-90 transition-all"
            title="Panggilan video"
          >
            <Video size={18} />
          </button>
          <button 
            id="chat-call-btn"
            onClick={() => setIsCalling("audio")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#006b53] hover:bg-[#bccac2]/30 active:scale-90 transition-all"
            title="Panggilan suara"
          >
            <Phone size={18} />
          </button>
          <button 
            id="chat-options-btn"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#bccac2]/30 active:scale-90 transition-all"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Messages Canvas with dotted background */}
      <div className="flex-1 overflow-y-auto chat-pattern p-4 relative" id="chat-container">
        <div className="flex flex-col gap-3 pb-4 max-w-3xl mx-auto">
          
          {/* Encryption Notice */}
          <div className="flex justify-center my-2">
            <div className="bg-white/80 border border-gray-100 text-[#3d4a44] font-sans text-[11px] px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-sm flex items-center gap-1.5 text-center max-w-md leading-relaxed font-medium">
              <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
              <span>Pesan terenkripsi secara end-to-end. Tidak ada pihak luar, bahkan Simkopdes, yang dapat membaca atau mendengarnya.</span>
            </div>
          </div>

          {/* Active Conversation Messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div 
                key={msg.id} 
                id={`msg-bubble-${msg.id}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"} group animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div 
                  className={`relative p-3 max-w-[80%] shadow-sm shadow-black/5 min-w-[120px] ${
                    isUser 
                      ? "bg-tertiary-fixed text-[#1a1c1c] rounded-2xl rounded-tr-none" 
                      : "bg-white text-[#1a1c1c] rounded-2xl rounded-tl-none"
                  }`}
                >
                  {/* Standard Message Text */}
                  <p className="font-sans text-[13.5px] leading-relaxed pr-10 whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Integrated Special Promotion Card */}
                  {msg.isPromo && (
                    <div className="border-t border-[#bccac2]/30 pt-3 mt-3 flex flex-col gap-2 relative">
                      {isBeliLoading ? (
                        <button 
                          disabled 
                          className="w-full bg-gray-50 border border-gray-200 text-primary py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold"
                        >
                          <div className="w-4 h-4 spinner text-primary"></div>
                          <span>Memproses Booking...</span>
                        </button>
                      ) : (
                        <button 
                          id="beli-sekarang-btn"
                          onClick={onBeliPromo}
                          className="w-full bg-white border border-[#bccac2] text-primary font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          <span>Beli Sekarang – Rp12.000/kg</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Booking Receipt Invoice */}
                  {msg.bookingInfo && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Kode Booking</span>
                        <span className="font-mono text-xs font-bold text-primary">#{msg.bookingInfo.bookingCode}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#1a1c1c]">{msg.bookingInfo.productName}</p>
                        <p className="text-[11px] text-gray-500">Harga: Rp {msg.bookingInfo.price.toLocaleString("id-ID")}/kg</p>
                      </div>
                      <div className="pt-1.5 border-t border-gray-200/50 text-[10px] text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-green-600">check_circle</span>
                        <span>Silakan ambil pesanan di gudang Simkopdes.</span>
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Status Double Checkmark */}
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 shrink-0">
                    <span className="font-sans text-[9px] text-[#3d4a44]/75">
                      {msg.timestamp}
                    </span>
                    {isUser && (
                      <span className={`material-symbols-outlined text-[13px] ${msg.status === "read" ? "text-primary" : "text-gray-400"}`}>
                        done_all
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing State Bubble */}
          {contact.status === "Typing..." && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white text-gray-500 rounded-xl rounded-tl-none px-3 py-2 shadow-sm flex items-center gap-1 text-xs">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Call Mock Screen Overlay */}
      {isCalling && (
        <div className="absolute inset-0 bg-primary/95 text-white z-40 flex flex-col items-center justify-between p-8 backdrop-blur-md">
          {/* Top */}
          <div className="text-center space-y-2 mt-12">
            <span className="inline-block text-[11px] tracking-widest font-bold uppercase text-primary-container bg-white/10 px-3 py-1 rounded-full">
              PANGGILAN {isCalling === "video" ? "VIDEO" : "SUARA"} SIMKOPDES
            </span>
            <h2 className="text-2xl font-bold">{contact.name}</h2>
            <p className="text-xs text-white/85">Menghubungkan asisten...</p>
          </div>

          {/* Mid Call Graphic */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 flex items-center justify-center animate-pulse">
              <img 
                src={contact.avatarUrl} 
                className="w-24 h-24 rounded-full object-cover" 
                alt={contact.name}
                referrerPolicy="no-referrer"
              />
            </div>
            {isCalling === "video" && (
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-black border border-white rounded-lg overflow-hidden shadow-md">
                <div className="w-full h-full bg-[#3d4a44] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="flex gap-4">
              <button 
                id="end-call-btn"
                onClick={() => setIsCalling(null)} 
                className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 active:scale-90 transition-all shadow-lg"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-xs text-white/50">Klik tombol merah untuk mengakhiri panggilan</p>
          </div>
        </div>
      )}

      {/* Bottom Chat Input Bar */}
      <form onSubmit={handleSend} className="bg-[#f3f3f4] px-4 py-3 flex items-center gap-2 border-t border-[#bccac2]/40 shrink-0">
        <button 
          type="button"
          id="input-emoji-btn"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#bccac2]/30 transition-colors"
          title="Emojis"
        >
          <Smile size={22} />
        </button>

        <button 
          type="button"
          id="input-attach-btn"
          onClick={() => {
            setInputText("Menanyakan ketersediaan pupuk dan bibit...");
          }}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#bccac2]/30 transition-colors"
          title="Klik untuk melampirkan pesan cepat"
        >
          <Paperclip size={22} />
        </button>

        {/* Dynamic recording layout */}
        {isRecording ? (
          <div className="flex-1 bg-[#bccac2]/20 rounded-xl flex items-center justify-between px-4 py-2 min-h-[44px] animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-red-600">REKORDING...</span>
            </div>
            <span className="font-mono text-xs text-[#1a1c1c]">{formatTime(recordingSeconds)}</span>
            <button 
              type="button"
              id="cancel-record-btn"
              onClick={() => setIsRecording(false)}
              className="text-gray-500 text-xs font-bold hover:text-red-600"
            >
              Batal
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-2 min-h-[44px] shadow-sm border border-[#bccac2]/20 focus-within:border-primary transition-colors">
            <input 
              id="chat-input-field"
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 font-sans text-xs text-[#1a1c1c] p-0" 
              placeholder="Ketik pesan..." 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {/* Submit or Record voice */}
        {inputText.trim() ? (
          <button 
            type="submit"
            id="chat-send-btn"
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary hover:bg-primary/95 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Send size={18} />
          </button>
        ) : (
          <button 
            type="button"
            id="chat-mic-btn"
            onClick={handleMicClick}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
              isRecording ? "bg-red-600 text-white animate-pulse" : "text-gray-500 hover:bg-[#bccac2]/30"
            }`}
            title="Tahan untuk merekam"
          >
            <Mic size={22} />
          </button>
        )}
      </form>
    </main>
  );
}
