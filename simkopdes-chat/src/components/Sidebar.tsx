import React, { useState, useEffect } from "react";
import { Contact, Announcement, Channel, Community } from "../types";
import { Search, MoreVertical } from "lucide-react";

interface SidebarProps {
  contacts: Contact[];
  selectedContactId: string;
  onSelectContact: (id: string) => void;
  activeTab: "chats" | "status" | "channels" | "communities";
  setActiveTab: (tab: "chats" | "status" | "channels" | "communities") => void;
}

export default function Sidebar({
  contacts,
  selectedContactId,
  onSelectContact,
  activeTab,
  setActiveTab,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "favourite" | "koperasi">("all");
  const [favourites, setFavourites] = useState<string[]>(["bot"]);

  // Fetch ancillary lists for tabs
  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error(err));

    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => setChannels(data))
      .catch((err) => console.error(err));

    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <aside className="flex h-screen fixed left-0 top-0 w-full sm:w-[350px] md:w-[400px] border-r border-[#bccac2]/40 bg-white z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      {/* WhatsApp Web Style Left Nav Rail */}
      <div className="w-[64px] bg-[#f0f2f5] border-r border-[#bccac2]/35 flex flex-col justify-between items-center py-4 shrink-0 h-full">
        {/* Top: Brand / Profile avatar with green status dot */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="relative group cursor-pointer shrink-0">
            <img 
              className="w-10 h-10 rounded-full object-cover bg-gray-200 border-2 border-white shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXCgAF2tUwHHM3L6n_oUnVcrLS2HM9uYN5D2KIxqVsb1_A-lMeV4HzIXRaDZLFCXvvqk50PADnt2pxcJxdO-KYnqdjm5zJzlQqOux29rB2kct4Gp7d80-FotbelS8Z-mYIjn45S30rrzQnWJ_DYoxHctGCqf8hQT4D1ow8a5mMYhyk8WA3zy3TTEnmWOtNc5fpMuzuSTXfCb31Ttwd599kdnxI_nl_O42hxcHVKclUWUghuN4kztw6Lfaybych0UytZ5noGmrjW5w" 
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#f0f2f5] rounded-full"></span>
          </div>

          {/* Navigation Action Icons */}
          <div className="flex flex-col gap-3 w-full px-1.5">
            <button 
              id="rail-chats-btn"
              onClick={() => setActiveTab("chats")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === "chats" 
                  ? "bg-[#e0e3e6] text-primary" 
                  : "text-[#3d4a44] hover:bg-[#bccac2]/25"
              }`}
              title="Chats"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${activeTab === "chats" ? 1 : 0}` }}>chat</span>
              {/* Unread indicator */}
              {contacts.some(c => c.unreadCount > 0) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#006b53] rounded-full animate-pulse"></span>
              )}
            </button>

            <button 
              id="rail-status-btn"
              onClick={() => setActiveTab("status")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === "status" 
                  ? "bg-[#e0e3e6] text-primary" 
                  : "text-[#3d4a44] hover:bg-[#bccac2]/25"
              }`}
              title="Status"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${activeTab === "status" ? 1 : 0}` }}>sync_lock</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#006b53] rounded-full"></span>
            </button>

            <button 
              id="rail-channels-btn"
              onClick={() => setActiveTab("channels")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === "channels" 
                  ? "bg-[#e0e3e6] text-primary" 
                  : "text-[#3d4a44] hover:bg-[#bccac2]/25"
              }`}
              title="Channels"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${activeTab === "channels" ? 1 : 0}` }}>groups</span>
            </button>

            <button 
              id="rail-communities-btn"
              onClick={() => setActiveTab("communities")}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                activeTab === "communities" 
                  ? "bg-[#e0e3e6] text-primary" 
                  : "text-[#3d4a44] hover:bg-[#bccac2]/25"
              }`}
              title="Communities"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${activeTab === "communities" ? 1 : 0}` }}>hub</span>
            </button>
          </div>
        </div>

        {/* Bottom: Settings button */}
        <div className="flex flex-col items-center gap-3 w-full px-1.5 pb-2">
          <button 
            id="rail-settings-btn"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#3d4a44] hover:bg-[#bccac2]/25 transition-all"
            title="Menu Lainnya"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Right Side: Active Tab Lists Area */}
      <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
        {/* Dynamic header title based on active tab */}
        <header className="flex items-center justify-between px-4 h-16 bg-[#f3f3f4]/40 border-b border-[#bccac2]/25 shrink-0">
          <h1 className="font-sans text-lg font-bold text-[#1a1c1c] tracking-tight">
            {activeTab === "chats" && "Chats"}
            {activeTab === "status" && "Status Koperasi"}
            {activeTab === "channels" && "Saluran Broadcast"}
            {activeTab === "communities" && "Grup Komunitas"}
          </h1>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
            Simkopdes
          </span>
        </header>

        {/* Search Bar */}
        <div className="p-2 shrink-0 border-b border-[#bccac2]/40 bg-white">
          <div className="relative bg-[#f3f3f4] rounded-lg flex items-center px-3 py-1.5 border border-transparent focus-within:border-primary transition-colors">
            <Search size={16} className="text-[#3d4a44] shrink-0" />
            <input 
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-[#1a1c1c] ml-2 placeholder:text-gray-400" 
              placeholder={
                activeTab === "chats" ? "Cari kontak..." :
                activeTab === "status" ? "Cari status..." :
                activeTab === "channels" ? "Cari saluran..." : "Cari komunitas..."
              }
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* WhatsApp Web Style Filter Pills */}
        {activeTab === "chats" && (
          <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0 border-b border-gray-100 bg-white scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setChatFilter("all")}
              className={`px-3 py-1 text-xs rounded-full transition-all shrink-0 font-sans font-medium cursor-pointer ${
                chatFilter === "all"
                  ? "bg-[#e1f3ec] text-[#006b53]"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setChatFilter("unread")}
              className={`px-3 py-1 text-xs rounded-full transition-all shrink-0 font-sans font-medium cursor-pointer relative ${
                chatFilter === "unread"
                  ? "bg-[#e1f3ec] text-[#006b53]"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
              }`}
            >
              Unread
              {contacts.some(c => c.unreadCount > 0) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#006b53] rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setChatFilter("favourite")}
              className={`px-3 py-1 text-xs rounded-full transition-all shrink-0 font-sans font-medium cursor-pointer flex items-center gap-1 ${
                chatFilter === "favourite"
                  ? "bg-[#e1f3ec] text-[#006b53]"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
              }`}
            >
              <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Favourite
            </button>
            <button
              onClick={() => setChatFilter("koperasi")}
              className={`px-3 py-1 text-xs rounded-full transition-all shrink-0 font-sans font-medium cursor-pointer ${
                chatFilter === "koperasi"
                  ? "bg-[#e1f3ec] text-[#006b53]"
                  : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
              }`}
            >
              Koperasi
            </button>
          </div>
        )}

        {/* Main Lists Section */}
        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === "chats" && (
            <div>
              {(() => {
                const filtered = contacts
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .filter(c => {
                    if (chatFilter === "unread") return c.unreadCount > 0;
                    if (chatFilter === "favourite") return favourites.includes(c.id);
                    if (chatFilter === "koperasi") return c.id === "center" || c.id === "admin";
                    return true;
                  });

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <span className="material-symbols-outlined text-[36px] text-gray-300 mb-2">chat_bubble_outline</span>
                      <p className="text-xs text-gray-400 font-sans">Tidak ada obrolan ditemukan</p>
                    </div>
                  );
                }

                return filtered.map((contact) => {
                  const isFav = favourites.includes(contact.id);
                  return (
                    <div 
                      key={contact.id}
                      id={`contact-item-${contact.id}`}
                      onClick={() => onSelectContact(contact.id)}
                      className={`flex items-center px-4 h-[72px] hover:bg-[#f3f3f4] cursor-pointer transition-colors border-b border-gray-100 ${
                        selectedContactId === contact.id ? "bg-[#f3f3f4]" : ""
                      }`}
                    >
                      <img 
                        className="w-12 h-12 rounded-full object-cover shrink-0 mr-3 border border-gray-100 bg-gray-50" 
                        src={contact.avatarUrl} 
                        alt={contact.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-sans text-sm font-semibold text-[#1a1c1c] truncate">
                            {contact.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-sans text-[11px] text-[#3d4a44]">
                              {contact.lastMessageTime}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFavourites(prev => 
                                  prev.includes(contact.id) 
                                    ? prev.filter(id => id !== contact.id) 
                                    : [...prev, contact.id]
                                );
                              }}
                              className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                                isFav 
                                  ? "text-amber-400 opacity-100" 
                                  : "text-gray-300 opacity-20 hover:opacity-100 hover:bg-black/5"
                              }`}
                              title={isFav ? "Hapus dari Favorit" : "Tandai sebagai Favorit"}
                            >
                              <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: `'FILL' ${isFav ? 1 : 0}` }}>star</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {contact.id === "bot" && (
                              <span className="material-symbols-outlined text-primary text-[16px] shrink-0">done_all</span>
                            )}
                            <span className={`font-sans text-xs truncate ${contact.status === "Typing..." ? "text-primary font-medium" : "text-[#3d4a44]"}`}>
                              {contact.status === "Typing..." ? "Mengetik..." : contact.lastMessage}
                            </span>
                          </div>
                          {contact.unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {activeTab === "status" && (
            <div className="p-3 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-primary font-bold px-1 mb-2">Live Status Koperasi</p>
              {announcements
                .filter(a => a.text.toLowerCase().includes(searchQuery.toLowerCase()) || a.author.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((a) => (
                  <div 
                    key={a.id} 
                    id={`announcement-${a.id}`}
                    className="p-3 bg-[#f9f9f9] border border-[#bccac2]/20 rounded-xl hover:shadow-sm transition-shadow flex gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {a.avatarLetter}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-xs text-[#1a1c1c]">{a.author}</span>
                        <span className="text-[10px] text-gray-400">{a.time}</span>
                      </div>
                      <p className="text-xs text-[#3d4a44] leading-relaxed font-sans">{a.text}</p>
                      <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full mt-1.5">
                        {a.tag}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "channels" && (
            <div className="p-3 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-primary font-bold px-1 mb-2">Saluran Broadcast Petani</p>
              {channels
                .filter(ch => ch.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ch) => (
                  <div 
                    key={ch.id} 
                    id={`channel-${ch.id}`}
                    className="p-3 bg-white border border-[#bccac2]/20 rounded-xl hover:bg-[#f9f9f9] transition-colors flex gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined">{ch.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-[#1a1c1c] truncate">{ch.title}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{ch.time}</span>
                      </div>
                      <p className="text-xs text-[#3d4a44] truncate mt-1 leading-normal font-sans">{ch.lastPost}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "communities" && (
            <div className="p-3 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-primary font-bold px-1 mb-2">Grup Komunitas Pertanian</p>
              {communities
                .filter(cm => cm.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((cm) => (
                  <div 
                    key={cm.id} 
                    id={`community-${cm.id}`}
                    className="p-3 border border-[#bccac2]/20 bg-[#f9f9f9] rounded-xl hover:shadow-sm transition-all flex gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{cm.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-xs text-[#1a1c1c] truncate">{cm.name}</span>
                        <span className="text-[10px] text-primary font-semibold shrink-0">{cm.membersCount}</span>
                      </div>
                      <p className="text-xs text-[#3d4a44] mt-1 leading-relaxed font-sans">{cm.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
