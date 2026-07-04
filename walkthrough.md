# Simkopdes Backend — Final Walkthrough

Selamat! Proyek **Simkopdes Backend** kini telah selesai dan terintegrasi secara _end-to-end_ dengan kedua sistem antarmuka (_frontend_). Dokumen ini merangkum seluruh pencapaian, arsitektur, dan cara memvalidasi fungsionalitas sistem yang telah kita buat.

---

## 🏗️ 1. Arsitektur & Teknologi

Kita telah berhasil membangun sistem *backend* dari nol menggunakan **FastAPI** yang berjalan di port `8000`. Sistem ini didesain sesuai dengan prinsip-prinsip *concurrency*, *idempotency*, dan asinkron untuk simulasi *traffic* tinggi koperasi:

- **JSON In-Memory DB (`app/database/json_db.py`)**: Sebagai simulasi basis data *thread-safe* dengan mekanisme penguncian (`asyncio.Lock`), menggantikan Redis/Postgres agar bisa berjalan lokal (portable).
- **Asynchronous Event Bus (`app/core/events.py`)**: Digunakan untuk komunikasi antar servis secara *non-blocking* menggunakan `asyncio.Queue`. 
- **WebSocket Manager (`app/websocket/ws_manager.py`)**: Menyediakan jalur komunikasi *real-time* ke sistem *frontend* (khususnya untuk *WhatsApp Blast* otomatis).

---

## 🚜 2. Fitur Utama yang Telah Diimplementasikan (Phase 1-10)

1. **Coop-Demand Engine**:
   > Sistem secara periodik (setiap 30 detik via `engine_scheduler.py`) mendeteksi barang *dead stock* di gudang. Jika terdeteksi, AI / Engine akan men-generate "Promosi/Campaign" dan mendiskon harganya.
2. **Idempotency & Optimistic Locking**:
   > Setiap transaksi pesanan (*booking*) yang masuk dicatat versinya untuk mencegah *double-spending* atau *race condition* saat diakses dari berbagai titik (Chat maupun Command Center).
3. **Queue System**:
   > Pemesanan (*booking*) diarahkan ke `booking_queue.py` (FIFO), diproses secara serial oleh *worker* agar transaksi stok dan pembuatan Ledger (*double-entry*) akurat.
4. **Reliability Scenarios**:
   > Menyediakan endpoint `/api/reliability/simulate` untuk mensimulasikan kegagalan jaringan atau server penuh, yang akan memaksa *circuit breaker* atau *retry mechanism* bekerja.

---

## 🔌 3. Integrasi Frontend (Phase 11)

Telah dilakukan modifikasi *proxy* dan integrasi API pada dua aplikasi *React* agar langsung menunjuk ke *backend* FastAPI:

- **WhatsApp Mock UI (`simkopdes-chat`)**:
  - Dihubungkan ke `/api/whatsapp/products` agar katalog sesuai dengan kondisi *database backend*.
  - Dihubungkan ke WebSocket (`ws://localhost:8000/ws/whatsapp/mem-001`) agar bisa menerima notifikasi Broadcast Promo dari Demand Engine secara langsung.
  - Memodifikasi tombol pemesanan untuk menembak `/api/whatsapp/book` dengan format *Payload* yang valid.
- **Enterprise Console (`simkopdes-enterprise-console`)**:
  - Dikonfigurasi ulang untuk berjalan di port `3001` dengan proxy ke `/api` backend FastAPI.

---

## 🎯 4. Panduan Validasi (Phase 12)

Kini Anda dapat menguji fungsionalitas sistem secara keseluruhan dari sisi UI. Ikuti langkah pengujian berikut:

### Skenario 1: Promo Otomatis (Demand Engine & WebSocket)
1. Buka browser dan akses **WhatsApp UI** di [http://localhost:3000](http://localhost:3000).
2. Perhatikan terminal backend (`python run.py`). Tunggu maksimal 30 detik hingga muncul log:
   `Demand Engine: Campaign generated for Beras Pandanwangi 5kg: 10% off`
3. Lihat ke halaman *Chat* WhatsApp UI Anda. Sebuah pesan **Promo Broadcast** otomatis akan muncul dari *KopDes x Arest AI*, lengkap dengan notifikasi dari *WebSocket*.

### Skenario 2: Pemesanan dan Validasi Stok (Queue & Idempotency)
1. Pada WhatsApp UI, klik tombol katalog atau ikuti tawaran promo tersebut.
2. Lakukan pemesanan produk.
3. Cek layar daftar **Pemesanan Saya (My Bookings)**. Pesanan Anda akan tercatat secara *real-time*.
4. (*Cek Terminal Backend*): Anda akan melihat bahwa transaksi diterima oleh **Gateway**, dimasukkan ke dalam **Queue**, lalu stok di gudang dikurangi. Sistem Ledger akan otomatis mencatat mutasi *Debit/Credit*.

> [!TIP]
> Semua log transaksi, pengurangan stok, serta *idempotency checks* tercatat dengan rapi di terminal *backend FastAPI*.

---
Semua tahap dari perancangan struktur hingga E2E testing dan *proxy networking* telah terselesaikan! 🚀
