import React, { useState, useEffect } from "react";
import { Contact, Message, Product } from "./types";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import CatalogModal from "./components/CatalogModal";
import MyBookingsModal from "./components/MyBookingsModal";

// Helper to get formatted current time (HH:MM)
const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}.${now.getMinutes().toString().padStart(2, "0")}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "channels" | "communities">("chats");
  const [selectedContactId, setSelectedContactId] = useState<string>("bot");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [bookingsRefreshTrigger, setBookingsRefreshTrigger] = useState(0);
  const [isBeliLoading, setIsBeliLoading] = useState(false);

  // Contacts Sidebar State
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "bot",
      name: "KopDes x Arest AI",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdyq21cDRqYbRNAhNaOdrkH1W9vzfMOkx5Svz_yZcbfGwDcb78RTzksSDFDTeRnfWg9aF57MoYuFhRDHAPs73QF71-9FSMsraa9HAXkVxtIoqKjDjYfHvZ9gkJOTBq3GG75PyBikc1X0ZFyVTVFuauXbtW8ynx6PkNUGr66h3YVCiBaXdjYxinW-g_9WsPHVsnMq6QuEQKbTX0UxIB952_0Hk6vOuLpMLPyufwm5QBtbrUi4P6VAizCvZlyTkyObHoT3_awn9LjWE",
      status: "Online",
      lastMessage: "Cukup, terima kasih.",
      lastMessageTime: "09:32",
      unreadCount: 1,
    },
    {
      id: "admin",
      name: "Petugas Admin",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXCgAF2tUwHHM3L6n_oUnVcrLS2HM9uYN5D2KIxqVsb1_A-lMeV4HzIXRaDZLFCXvvqk50PADnt2pxcJxdO-KYnqdjm5zJzlQqOux29rB2kct4Gp7d80-FotbelS8Z-mYIjn45S30rrzQnWJ_DYoxHctGCqf8hQT4D1ow8a5mMYhyk8WA3zy3TTEnmWOtNc5fpMuzuSTXfCb31Ttwd599kdnxI_nl_O42hxcHVKclUWUghuN4kztw6Lfaybych0UytZ5noGmrjW5w",
      status: "Online",
      lastMessage: "Laporan mingguan sudah siap, Pak.",
      lastMessageTime: "Yesterday",
      unreadCount: 0,
    },
    {
      id: "center",
      name: "Koperasi Pusat",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBB0i3ybGgj3DDmq5xGdt7qBa4X0QRGLyfNmzs7WiajGnHcPfbKsDu2VKtLdiDg3aIgqRYc2WNkbH8WFRaUZ79fQyXP22c0xe4WEEEgGSDN--V1bJcZm2_yTBsl7x_nOtDhal_tQGnONz6ORkIu2Vm0lX45nJC1mVk7Gbrpdils_qisRvs4H8UGoWIHXCeNA9GHfvZAgBVE9UfRLcUqEynAQHqFj9MUSc4AbWgiEILfDYs_YQVTd3v1vQOLMaGcsHKNPTdNT0MKeb0",
      status: "Offline",
      lastMessage: "Harap periksa stok pupuk terbaru.",
      lastMessageTime: "Tuesday",
      unreadCount: 0,
    },
  ]);

  // Threads History Map State
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    bot: [
      {
        id: "b-m1",
        sender: "user",
        text: "Mohon info jadwal pengambilan stok barang untuk minggu ini.",
        timestamp: "09.30",
        status: "read",
      },
      {
        id: "b-m2",
        sender: "bot",
        text: "Baik, jadwal pengambilan minggu ini adalah hari Kamis dan Jumat mulai pukul 08.00 hingga 15.00 WIB. Ada yang bisa dibantu lagi?",
        timestamp: "09.31",
      },
      {
        id: "b-m3",
        sender: "user",
        text: "Cukup, terima kasih.",
        timestamp: "09.32",
        status: "read",
      },
    ],
    admin: [
      {
        id: "ad-m1",
        sender: "user",
        text: "Bagaimana berkas laporan administrasi penyerapan pupuk desa Makmur Jaya?",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "ad-m2",
        sender: "admin",
        text: "Laporan mingguan sudah siap, Pak.",
        timestamp: "Yesterday",
      },
    ],
    center: [
      {
        id: "c-m1",
        sender: "user",
        text: "Apakah alokasi pengiriman NPK Phonska sudah disetujui untuk bulan ini?",
        timestamp: "Tuesday",
        status: "read",
      },
      {
        id: "c-m2",
        sender: "center",
        text: "Harap periksa stok pupuk terbaru.",
        timestamp: "Tuesday",
      },
    ],
  });

  // Connect to FastAPI WebSocket for real-time WhatsApp Blasts
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(`ws://localhost:8000/ws/whatsapp/mem-001`);
      
      ws.onopen = () => {
        console.log("Connected to WhatsApp Backend WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // The FastAPI backend sends messages in format: { event: string, data: any, timestamp: string }
          if (payload.event === "whatsapp_message" && payload.data && payload.data.type === "campaign_blast") {
            const data = payload.data;
            const promoMsg: Message = {
              id: `b-promo-${Date.now()}`,
              sender: "bot",
              text: data.message,
              timestamp: getCurrentTime(),
              isPromo: true,
              promoPrice: data.promo_price,
            };

            setMessages((prev) => {
              const currentBotMessages = prev.bot || [];
              return {
                ...prev,
                bot: [...currentBotMessages, promoMsg],
              };
            });

            setContacts((prev) =>
              prev.map((c) =>
                c.id === "bot"
                  ? {
                      ...c,
                      lastMessage: data.message.substr(0, 25) + "...",
                      lastMessageTime: getCurrentTime(),
                      unreadCount: c.unreadCount + 1,
                    }
                  : c
              )
            );
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WhatsApp Backend WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        if (ws) ws.close(); // Triggers onclose and reconnect
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
    };
  }, []);

  // Send an outgoing text message to assistant and process reply
  const handleSendMessage = async (text: string) => {
    const activeId = selectedContactId as "bot" | "admin" | "center";
    const userMsgTime = getCurrentTime();
    const newMsgId = `m-${Math.random().toString(36).substr(2, 9)}`;

    const newUserMsg: Message = {
      id: newMsgId,
      sender: "user",
      text,
      timestamp: userMsgTime,
      status: "sent",
    };

    // Update active thread with user message immediately
    const updatedThread = [...(messages[activeId] || []), newUserMsg];
    setMessages((prev) => ({
      ...prev,
      [activeId]: updatedThread,
    }));

    // Update contacts list last message preview
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: text.length > 25 ? text.substr(0, 25) + "..." : text,
              lastMessageTime: userMsgTime,
              status: "Typing...",
            }
          : c
      )
    );

    try {
      // API call to Express / Gemini backend proxy
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: activeId,
          message: text,
          history: updatedThread.slice(-8), // Send context window of last 8 messages
        }),
      });

      const data = await response.json();

      // Check user checkmarks (change single checkmark to blue read checks)
      setMessages((prev) => {
        const thread = prev[activeId] || [];
        const checkedThread = thread.map((m) =>
          m.id === newMsgId ? { ...m, status: "read" as const } : m
        );

        // Add assistant's actual generated response
        const assistMsgId = `assist-${Math.random().toString(36).substr(2, 9)}`;
        const assistMsg: Message = {
          id: assistMsgId,
          sender: activeId,
          text: data.text || "Terjadi kesalahan koneksi asisten.",
          timestamp: getCurrentTime(),
        };

        return {
          ...prev,
          [activeId]: [...checkedThread, assistMsg],
        };
      });

      // Reset contact status to online and save last message
      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: activeId === "center" ? "Offline" : "Online",
                lastMessage: data.text ? (data.text.length > 25 ? data.text.substr(0, 25) + "..." : data.text) : c.lastMessage,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to query cooperative AI:", err);
      // Fallback response in thread
      setMessages((prev) => {
        const thread = prev[activeId] || [];
        const fallbackMsg: Message = {
          id: `err-${Date.now()}`,
          sender: activeId,
          text: "Mohon maaf, koneksi asisten sedang sibuk. Silakan coba kirim ulang pesan Bapak.",
          timestamp: getCurrentTime(),
        };
        return {
          ...prev,
          [activeId]: [...thread, fallbackMsg],
        };
      });

      setContacts((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, status: "Online" } : c))
      );
    }
  };

  // Dedicated transaction booking click handler for Beras Pandanwangi promo
  const handleBeliPromo = async (promoMsgId?: string) => {
    setIsBeliLoading(true);

    const updatePromoStatus = (status: "idle" | "loading" | "success" | "error") => {
      setMessages((prev) => {
        const thread = prev.bot || [];
        const msgIdToUpdate = promoMsgId || thread.slice().reverse().find(m => m.isPromo)?.id;
        if (!msgIdToUpdate) return prev;
        
        return {
          ...prev,
          bot: thread.map((m) =>
            m.id === msgIdToUpdate ? { ...m, promoStatus: status } : m
          ),
        };
      });
    };

    updatePromoStatus("loading");

    const timestamp = getCurrentTime();

    // Append user outgoing message
    const userMsgId = `m-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: "Saya ingin membeli promo Beras Pandanwangi.",
      timestamp,
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      bot: [...prev.bot, userMsg],
    }));

    try {
      // Post real booking row to server state
      const res = await fetch("/api/whatsapp/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: "mem-001",
          product_id: "prod-001",
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error("API responded with an error");
      const bookingData = await res.json();

      // Simulate double checks and append automated cooperative voucher
      setTimeout(() => {
        setMessages((prev) => {
          const thread = prev.bot || [];
          // Change single check to read check for the confirmation
          const checkedThread = thread.map((m) =>
            m.id === userMsgId ? { ...m, status: "read" as const } : m
          );

          const botReply: Message = {
            id: `b-confirm-${Date.now()}`,
            sender: "bot",
            text: `✅ Terima kasih atas pesanan Anda. Pesanan sedang diproses oleh koperasi. Kode Booking: #${bookingData.booking?.booking_code || "BK-001"}. Silakan melakukan pembayaran atau mengambil barang sesuai instruksi petugas.`,
            timestamp: getCurrentTime(),
            bookingInfo: {
              productName: bookingData.booking?.product_name || "Beras Pandanwangi 5kg",
              price: bookingData.booking?.unit_price || 60000,
              bookingCode: bookingData.booking?.booking_code || "BK-001",
              status: bookingData.booking?.status || "Confirmed",
            },
          };

          return {
            ...prev,
            bot: [...checkedThread, botReply],
          };
        });

        // Update sidebar preview
        setContacts((prev) =>
          prev.map((c) =>
            c.id === "bot"
              ? {
                  ...c,
                  lastMessage: "✅ Terima kasih atas pesanan...",
                  lastMessageTime: getCurrentTime(),
                }
              : c
          )
        );

        setBookingsRefreshTrigger((prev) => prev + 1);
        updatePromoStatus("success");
        setIsBeliLoading(false);
      }, 500);
    } catch (err) {
      console.error("Booking failed:", err);
      updatePromoStatus("error");
      setIsBeliLoading(false);
    }
  };

  // Catalog item purchase action
  const handleOrderProduct = async (product: Product, quantity: number) => {
    const activeId = selectedContactId as "bot" | "admin" | "center";
    const timestamp = getCurrentTime();

    // Outgoing user order text
    const orderTxt = `Saya ingin memesan ${product.name} (Jumlah: ${quantity} ${product.unit}).`;
    const userMsgId = `m-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: orderTxt,
      timestamp,
      status: "read",
    };

    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), userMsg],
    }));

    try {
      // Save product booking to server state
      const res = await fetch("/api/whatsapp/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: "mem-001",
          product_id: product.id,
          quantity: quantity,
        }),
      });

      const booking = await res.json();

      // Bot auto receipt response
      setTimeout(() => {
        const confirmTxt = `✅ Baik Bapak Budi Santoso, pesanan Anda berupa ${quantity} ${product.unit} ${product.name} telah kami catat dengan Kode Booking #${booking.bookingCode}. Silakan mengambil barang Anda sesuai jadwal di Gudang Koperasi.`;
        const botConfirm: Message = {
          id: `m-catalog-conf-${Date.now()}`,
          sender: activeId,
          text: confirmTxt,
          timestamp: getCurrentTime(),
          bookingInfo: {
            productName: `${product.name} (${quantity} ${product.unit})`,
            price: (product.promoPrice || product.price) * quantity,
            bookingCode: booking.booking_code,
            status: booking.status,
          },
        };

        setMessages((prev) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), botConfirm],
        }));

        setContacts((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  lastMessage: `✅ Pesanan telah dicatat...`,
                  lastMessageTime: getCurrentTime(),
                }
              : c
          )
        );

        setBookingsRefreshTrigger((prev) => prev + 1);
      }, 500);
    } catch (err) {
      console.error(err);
    }
  };

  const currentContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const currentMessages = messages[selectedContactId] || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f9f9f9] text-[#1a1c1c] font-sans">
      {/* Sidebar Navigation & Contacts list */}
      <Sidebar
        contacts={contacts}
        selectedContactId={selectedContactId}
        onSelectContact={(id) => {
          setSelectedContactId(id);
          // Mark as read when clicking on contact
          setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Chat thread canvas */}
      <ChatWindow
        contact={currentContact}
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        onBeliPromo={handleBeliPromo}
        isBeliLoading={isBeliLoading}
      />

      {/* Dynamic catalog of agricultural supplies */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onOrderProduct={handleOrderProduct}
      />

      {/* Member invoices and booking histories */}
      <MyBookingsModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        refreshTrigger={bookingsRefreshTrigger}
      />
    </div>
  );
}
