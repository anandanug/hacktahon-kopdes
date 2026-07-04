import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Chat Assistant endpoint for Cooperative Advice
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const userPrompt = messages[messages.length - 1]?.content || "Halo";

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Graceful fallback when API key is missing
      return res.json({
        text: `[SIMULASI AI - API Key Belum Dikonfigurasi]
Halo! Saya Asisten AI SIMKOPDES. Untuk menggunakan analisis AI asli, silakan tambahkan kunci API Anda di menu Secrets dengan nama \`GEMINI_API_KEY\`.

Sebagai simulasi, berikut tanggapan saya terhadap pertanyaan Anda mengenai "${userPrompt}":
1. **Optimasi Stok Sembako**: Disarankan melakukan Flash Sale via WhatsApp dengan diskon 10-15% untuk barang stagnant seperti Beras dan Minyak Goreng yang berumur di atas 30 hari.
2. **Kesehatan Kas**: Arus kas Koperasi saat ini dalam keadaan sangat sehat (Sisa Hasil Usaha meningkat 12% MoM).
3. **Pemberitahuan Anggota**: Gunakan integrasi WA Gateway untuk menagih pinjaman jatuh tempo secara otomatis demi menekan NPL (Non-Performing Loan).`,
      });
    }

    const systemInstruction = `Anda adalah Asisten Ahli Manajemen Koperasi Desa (SIMKOPDES). 
Tugas Anda adalah membantu pengurus koperasi menganalisis data keuangan, mengoptimalkan stok inventaris (terutama barang stagnant/stale), meningkatkan loyalitas anggota, dan memberikan saran operasional yang taktis.
Gunakan bahasa Indonesia yang profesional, ramah, dan mudah dipahami oleh pengurus koperasi di desa.
Berikan rekomendasi yang praktis seperti penggunaan pesan otomatis WhatsApp untuk promosi flash sale, pengelolaan arus kas, dan pendataan anggota.`;

    const chatMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Put system instruction as config
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `System context: ${systemInstruction}\n\nUser request: ${userPrompt}` }]
        }
      ]
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in chat:", error);
    res.status(500).json({
      error: "Gagal menghasilkan respon AI.",
      details: error.message || String(error),
    });
  }
});

// AI Stagnant Inventory Optimizer
app.post("/api/ai/analyze-stagnant", async (req, res) => {
  const { product, stagnatDays, stock, unitPrice, discount } = req.body;

  if (!product) {
    return res.status(400).json({ error: "Product name is required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analisis produk stagnant berikut dan buatkan strategi pemasaran cepat:
Nama Produk: ${product}
Durasi Mengendap (Stagnat): ${stagnatDays} hari
Jumlah Stok: ${stock}
Perkiraan Diskon AI: ${discount || "10%"}

Berikan output berupa:
1. Rekomendasi harga & analisis singkat mengapa produk ini tertahan.
2. Draft teks promosi Broadcast WhatsApp yang ramah, menarik, dan persuasif untuk anggota koperasi agar segera membelinya (gunakan bahasa Indonesia santun).`;

    if (!ai) {
      // Graceful fallback
      return res.json({
        analysis: `Analisis Simulasi untuk ${product}:
- **Penyebab**: Stok terlalu besar (${stock}) dan kurangnya eksposur promosi selama ${stagnatDays} hari terakhir.
- **Rekomendasi**: Berikan diskon ${discount || "10%"} untuk mengonversi stok menjadi kas secepatnya, mengurangi modal tertahan.`,
        whatsappDraft: `📢 *PROMO SPECIAL KOPERASI SIMKOPDES!* 📢

Halo Bapak/Ibu Anggota Koperasi yang budiman! 😊
Ada kabar gembira! Kami sedang mengadakan promo kilat khusus hari ini untuk produk berkualitas kami:

🌾 *${product}*
✨ Dapatkan diskon spesial sebesar *${discount || "10%"}* dari harga normal!
📦 Stok sangat terbatas, hanya tersisa *${stock}* saja!

Ayo segera pesan sekarang sebelum kehabisan dengan membalas pesan ini atau hubungi Admin Koperasi kami. Belanja di Koperasi, dari kita untuk kita! 🏛️💚`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    // Parse the text into analysis and whatsappDraft parts
    res.json({
      fullOutput: text,
      analysis: text.split("Draft teks")[0] || text,
      whatsappDraft: text.includes("Broadcast WhatsApp")
        ? text.substring(text.indexOf("Broadcast WhatsApp"))
        : "Draft teks promosi silakan cek di output analisis lengkap.",
    });
  } catch (error: any) {
    console.error("Gemini API Error in analyze-stagnant:", error);
    res.status(500).json({
      error: "Gagal menghasilkan analisa produk.",
      details: error.message || String(error),
    });
  }
});

// Setup dev server or static file serving
async function startServer() {
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
    console.log(`SIMKOPDES Enterprise Server running on http://localhost:${PORT}`);
  });
}

startServer();
