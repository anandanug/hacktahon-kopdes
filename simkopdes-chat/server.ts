import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client safely (lazy-loaded or conditional on request)
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI Chat will run in fallback simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Bookings State (Persistent for current server run)
interface Booking {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  customerName: string;
  bookingCode: string;
  status: "Pending" | "Confirmed" | "Completed";
  createdAt: string;
}

const mockBookings: Booking[] = [
  {
    id: "b-1",
    productName: "Beras Pandanwangi (Promo)",
    price: 12000,
    quantity: 1,
    customerName: "Budi Santoso",
    bookingCode: "BK-001",
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  }
];

// Mock Products Catalog
const mockProducts = [
  {
    id: "p-1",
    name: "Beras Pandanwangi Premium",
    price: 14500,
    promoPrice: 12000,
    unit: "kg",
    category: "Pangan",
    stock: 250,
    description: "Beras aromatik khas Pandanwangi berkualitas super langsung dari petani binaan Simkopdes.",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    isPromo: true,
  },
  {
    id: "p-2",
    name: "Pupuk Urea Subsidi",
    price: 112500,
    unit: "karung (50kg)",
    category: "Pupuk",
    stock: 80,
    description: "Pupuk nitrogen konsentrasi tinggi untuk merangsang pertumbuhan vegetatif tanaman padi dan jagung.",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=600&q=80",
    isPromo: false,
  },
  {
    id: "p-3",
    name: "Pupuk NPK Phonska",
    price: 175000,
    unit: "karung (50kg)",
    category: "Pupuk",
    stock: 45,
    description: "Pupuk majemuk seimbang mengandung Nitrogen, Fosfat, dan Kalium untuk meningkatkan kualitas panen.",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
    isPromo: false,
  },
  {
    id: "p-4",
    name: "Bibit Padi Unggul Ciherang",
    price: 65000,
    unit: "pack (5kg)",
    category: "Benih",
    stock: 120,
    description: "Bibit padi bersertifikat dengan potensi hasil tinggi, tahan hama wereng coklat tipe 1 & 2.",
    imageUrl: "https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80",
    isPromo: false,
  },
];

// API: Announcements (for Status tab)
app.get("/api/announcements", (req, res) => {
  res.json([
    {
      id: "a-1",
      author: "Admin Simkopdes",
      avatarLetter: "A",
      text: "🌾 Promo Overstock Beras Pandanwangi hari ini Rp12.000/kg (Harga Normal Rp14.500/kg). Berlaku hingga pukul 20.00 WIB malam ini!",
      time: "08:15",
      tag: "Promo",
    },
    {
      id: "a-2",
      author: "Petugas Lapangan",
      avatarLetter: "PL",
      text: "🚜 Jadwal pengambilan pupuk bersubsidi kelompok tani Subur Makmur resmi diperpanjang sampai hari Jumat ini pukul 15.00 WIB.",
      time: "Kemarin",
      tag: "Distribusi",
    },
    {
      id: "a-3",
      author: "Koperasi Pusat",
      avatarLetter: "KP",
      text: "📢 Rapat anggota tahunan (RAT) koperasi akan diselenggarakan hari Sabtu, 11 Juli 2026 secara hybrid di Balai Desa dan Zoom.",
      time: "Selasa",
      tag: "Rapat RAT",
    }
  ]);
});

// API: Channels (for Channels tab)
app.get("/api/channels", (req, res) => {
  res.json([
    {
      id: "ch-1",
      title: "Tips Pertanian Organik",
      icon: "eco",
      unread: true,
      lastPost: "Metode pemupukan organik menggunakan kompos jerami padi meningkatkan hasil panen hingga 15%. Cobalah kurangi pupuk kimia secara bertahap.",
      time: "10:30",
    },
    {
      id: "ch-2",
      title: "Informasi Cuaca Desa",
      icon: "wb_sunny",
      unread: false,
      lastPost: "Prakiraan cuaca minggu ini: Hujan ringan di sore hari. Sangat baik untuk memulai persemaian bibit padi varietas Ciherang.",
      time: "Kemarin",
    },
    {
      id: "ch-3",
      title: "Pasar Komoditas Tani",
      icon: "trending_up",
      unread: false,
      lastPost: "Update harga hari ini: Gabah Kering Giling (GKG) naik ke Rp6.800/kg. Cabe rawit stabil di Rp42.000/kg.",
      time: "Selasa",
    }
  ]);
});

// API: Communities (for Communities tab)
app.get("/api/communities", (req, res) => {
  res.json([
    {
      id: "cm-1",
      name: "Kelompok Tani Padi Unggul",
      membersCount: "142 Anggota",
      description: "Diskusi seputar penanaman, pengendalian hama wereng, dan pengairan persawahan padi.",
      icon: "agriculture",
    },
    {
      id: "cm-2",
      name: "Sobat Ternak Simkopdes",
      membersCount: "68 Anggota",
      description: "Komunitas peternak kambing dan sapi desa. Info pasokan pakan, vaksinasi, dan penjualan hewan kurban.",
      icon: "pets",
    },
    {
      id: "cm-3",
      name: "Asosiasi Budidaya Jamur",
      membersCount: "35 Anggota",
      description: "Forum berbagi pengalaman budidaya jamur tiram dan jamur merang di baglog kayu.",
      icon: "yard",
    }
  ]);
});

// API: AI Assistant Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { character, message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message parameter is required." });
  }

  // Define System Instructions for the selected character
  let systemInstruction = "";
  if (character === "bot") {
    systemInstruction = `
You are "KopDes x Arest AI", the friendly, polite, and responsive AI agricultural assistant for the "Simkopdes Cooperative" (Koperasi Simpan Pinjam dan Usaha Desa).
Your primary target audience is local village farmers and members. Your language MUST be highly polite, warm, and professional, using standard Indonesian (Bahasa Indonesia) terminology (such as "Bapak", "Ibu", "Rekan", "Koperasi").

Core Knowledge & Services:
1. OVERSTOCK PROMO: Today there is a special promo for "Beras Pandanwangi" at Rp12.000/kg (normal price Rp14.500/kg), available until 20:00 WIB. If members are interested in ordering, guide them politely. They can also use the integrated button on screen to order instantly!
2. STOCKS: Rice stock is high (overstock). Fertilizers (Urea, NPK Phonska) are available. Urea is Rp112.500 per 50kg bag, NPK is Rp175.000 per 50kg bag. Rice seeds (Ciherang pack 5kg) are Rp65.000.
3. SCHEDULE: Stock pick-up/distributing is open on Thursdays (Kamis) and Fridays (Jumat) from 08:00 to 15:00 WIB at the main cooperative warehouse.
4. SAVINGS & LOANS: We support member savings (Simpanan Pokok Rp50.000, Wajib Rp10.000/month, Sukarela arbitrary) and small micro-credit loans for farmers starting from Rp1.000.000 with a low cooperative rate.

If a member wants to book or buy products, encourage them to ask or purchase. Ensure your tone is supportive, helpful, matches local Indonesian cooperative vibes, and always maintain high trust. Keep responses concise and natural for chat (under 3-4 paragraphs). Use bullet points if listing information.
`;
  } else if (character === "admin") {
    systemInstruction = `
You are "Petugas Admin" (named Adi), a cooperative desk staff member who is very polite, formal, neat, and highly administrative.
You help members with scheduling, paperwork, weekly reports, member registrations, and balance check requests.
Your tone is structured, polite, using "Selamat pagi/siang Bapak/Ibu", and very professional.
You have the weekly agricultural report ready ("Laporan mingguan sudah siap, Pak.") and can summarize details of reports or village cooperative stats if asked.
Provide highly structured administrative assistance. Keep answers helpful and structured in Indonesian.
`;
  } else if (character === "center") {
    systemInstruction = `
You are "Koperasi Pusat" (represented by Pak Siregar, Chief of Supply & Logistics).
Your tone is experienced, direct but respectable, authoritative, and very informative about agricultural policies, fertilizer quotas, and large scale food security.
You always urge members to verify fertilizer stocks ("Harap periksa stok pupuk terbaru.") before the planting season.
You talk about bulk distribution, central government subsidies, and cooperative logistics.
Respond politely and knowledgeably as a senior village cooperative head in Indonesian.
`;
  } else {
    systemInstruction = "You are a helpful cooperative agent of Simkopdes Cooperative. Respond politely in Indonesian.";
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return beautiful fallback simulated response if no API key is set
      console.log("No API Key. Returning simulated fallback response.");
      let fallbackText = "";
      const lowerMessage = message.toLowerCase();

      if (character === "bot") {
        if (lowerMessage.includes("jadwal") || lowerMessage.includes("ambil") || lowerMessage.includes("stok")) {
          fallbackText = "Halo Bapak/Ibu! Jadwal pengambilan barang dan pupuk minggu ini di gudang Simkopdes adalah hari Kamis dan Jumat mulai pukul 08.00 hingga 15.00 WIB. Silakan membawa KTP atau Kartu Anggota Koperasi saat pengambilan. Ada yang bisa kami bantu lagi?";
        } else if (lowerMessage.includes("beli") || lowerMessage.includes("beras") || lowerMessage.includes("promo")) {
          fallbackText = "Tentu Bapak! Khusus hari ini kami ada promo overstock Beras Pandanwangi Premium seharga Rp12.000/kg (Normal Rp14.500/kg). Bapak bisa langsung memesan dengan mengeklik tombol 'Beli Sekarang' di dalam pesan promo kami, atau sebutkan jumlah kilo yang ingin dipesan agar saya bantu catat.";
        } else if (lowerMessage.includes("pupuk") || lowerMessage.includes("urea") || lowerMessage.includes("npk")) {
          fallbackText = "Untuk ketersediaan pupuk saat ini:\n\n1. **Pupuk Urea Subsidi**: Tersedia (Stok 80 karung) - Rp112.500 / 50kg\n2. **Pupuk NPK Phonska**: Tersedia (Stok 45 karung) - Rp175.000 / 50kg\n\nApakah Bapak ingin melakukan booking untuk kuota kelompok tani Bapak?";
        } else {
          fallbackText = `Selamat datang di Layanan Pintar KopDes x Arest AI! 😊 Saya siap membantu menjawab pertanyaan Bapak/Ibu mengenai stok komoditas (Beras Pandanwangi), kuota pupuk (Urea, NPK), jadwal pengambilan, maupun simpan pinjam di koperasi. Silakan tanyakan informasi yang Bapak/Ibu butuhkan.`;
        }
      } else if (character === "admin") {
        fallbackText = `Selamat datang di layanan Administrasi Simkopdes. Saya Adi, petugas administrasi Anda. Mengenai laporan mingguan dan bulanan, berkasnya sudah siap dan telah kami verifikasi. Ada administrasi atau surat pengantar lain yang bisa saya bantu buatkan hari ini?`;
      } else {
        fallbackText = `Halo Rekan Petani. Saya Siregar dari Koperasi Pusat. Terkait alokasi pupuk subsidi periode ini, kami mengimbau seluruh ketua kelompok tani untuk segera memverifikasi data anggotanya agar tidak terjadi keterlambatan distribusi di gudang wilayah. Harap segera periksa stok pupuk terbaru.`;
      }

      // Add small timeout to simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.json({ text: fallbackText });
    }

    // Call real Gemini API
    const ai = getGenAI();
    
    // Format message history for GoogleGenAI SDK
    // Format: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const item of history) {
        formattedContents.push({
          role: item.sender === "user" ? "user" : "model",
          parts: [{ text: item.text }],
        });
      }
    }
    
    // Push the current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Maaf, terjadi kesalahan saat menghubungi asisten AI Simkopdes. Silakan coba sesaat lagi.",
      details: error.message || error,
    });
  }
});

async function start() {
  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Simkopdes Server running on http://localhost:${PORT}`);
  });
}

start();
