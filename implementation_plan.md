# Simkopdes Backend — Full Implementation Plan

## Background

Membangun backend **FastAPI** yang menghubungkan dua frontend yang sudah ada:
1. **simkopdes-chat** (WhatsApp Mock UI) — berjalan di port 3000, menggunakan Express + Vite
2. **simkopdes-enterprise-console** (SIMKOPDES Command Center) — berjalan di port 3000, menggunakan Express + Vite

Backend baru ini akan menjadi **single source of truth** untuk seluruh data dan logika bisnis, menggantikan mock data yang saat ini di-hardcode di masing-masing frontend server.

---

## User Review Required

> [!IMPORTANT]
> **Port Assignment Strategy**: Saat ini kedua frontend sama-sama menggunakan port 3000. Rencana saya:
> - **Backend FastAPI**: port **8000**
> - **simkopdes-chat**: tetap port **3000**
> - **simkopdes-enterprise-console**: pindah ke port **3001**
> - Kedua frontend akan di-proxy ke backend via Vite proxy config

> [!IMPORTANT]
> **Frontend Modification**: Kedua frontend perlu dimodifikasi untuk:
> 1. Mengarahkan API calls ke backend FastAPI (via Vite proxy `/api` → `http://localhost:8000`)
> 2. Menambahkan WebSocket client untuk menerima real-time updates
> 3. Menghapus mock data hardcoded dan menggantinya dengan fetch dari backend
>
> Apakah Anda setuju dengan pendekatan ini?

> [!WARNING]
> **Coop-Demand Engine Scheduler**: Engine ini akan berjalan sebagai background task di dalam FastAPI menggunakan `asyncio` scheduler (bukan Celery/Redis, karena ini hackathon demo). Engine akan melakukan analisis setiap **30 detik** (configurable) agar demo terlihat dinamis.

---

## Open Questions

> [!IMPORTANT]
> 1. **Anggota Koperasi**: Apakah data member (Budi Hartono, Siti Aminah, dll dari enterprise console) harus menjadi user yang bisa login di WhatsApp Mock, atau cukup data statis?
> 2. **Jumlah member WhatsApp blast target**: Untuk demo, berapa jumlah simulated member yang menerima blast? (Saat ini di frontend tertulis 142 anggota)
> 3. **Persistence**: Data di JSON In-Memory Database akan hilang saat server restart. Apakah perlu auto-save ke file JSON agar bisa di-load ulang?

---

## Proposed Changes

### Project Structure

```
hackathon/
├── simkopdes-backend/          ← [NEW] FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry, CORS, lifespan events
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py       # App settings & constants
│   │   │   └── events.py       # Event bus for internal pub/sub
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── product.py      # Product, StockMovement
│   │   │   ├── booking.py      # Booking, BookingStatus
│   │   │   ├── member.py       # Member, Savings
│   │   │   ├── ledger.py       # LedgerEntry
│   │   │   ├── campaign.py     # Campaign, CampaignTarget
│   │   │   ├── queue_item.py   # QueueItem
│   │   │   └── reliability.py  # ReliabilityEvent, SimulationResult
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── json_db.py      # JSON In-Memory Database with file backup
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ledger_service.py      # CRUD produk, stok, transaksi
│   │   │   ├── demand_engine.py       # Coop-Demand Engine (rolling-window, dead stock)
│   │   │   ├── booking_service.py     # Booking lifecycle management
│   │   │   ├── campaign_service.py    # Campaign generation & blast
│   │   │   ├── gateway_service.py     # Idempotency, optimistic locking
│   │   │   └── reliability_service.py # Simulation scenarios
│   │   ├── queue/
│   │   │   ├── __init__.py
│   │   │   └── booking_queue.py # asyncio.Queue FIFO processor
│   │   ├── scheduler/
│   │   │   ├── __init__.py
│   │   │   └── engine_scheduler.py # Periodic demand engine runner
│   │   ├── websocket/
│   │   │   ├── __init__.py
│   │   │   └── ws_manager.py   # WebSocket connection manager & broadcaster
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── products.py     # Product CRUD endpoints
│   │   │   ├── bookings.py     # Booking endpoints (create, cancel, confirm)
│   │   │   ├── campaigns.py    # Campaign trigger & list
│   │   │   ├── ledger.py       # Ledger query & sync
│   │   │   ├── members.py      # Member management
│   │   │   ├── gateway.py      # API Gateway endpoints (idempotency, etc)
│   │   │   ├── whatsapp.py     # WhatsApp Mock integration endpoints
│   │   │   ├── dashboard.py    # Command Center data endpoints
│   │   │   ├── reliability.py  # Reliability simulation endpoints
│   │   │   └── ws_routes.py    # WebSocket endpoint registration
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── helpers.py      # ID generators, time formatters
│   │       └── idempotency.py  # Idempotency key store & validator
│   ├── data/
│   │   └── seed.json           # Initial seed data (products, members, etc)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_ledger.py
│   │   ├── test_booking.py
│   │   ├── test_queue.py
│   │   ├── test_gateway.py
│   │   └── test_e2e.py
│   ├── requirements.txt
│   └── run.py                  # Uvicorn launcher script
├── simkopdes-chat/             ← [MODIFY] Add proxy & WS client
└── simkopdes-enterprise-console/ ← [MODIFY] Add proxy & WS client
```

---

### Phase 1: Project Foundation & JSON Database

#### [NEW] [requirements.txt](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/requirements.txt)
- FastAPI, uvicorn, pydantic, websockets, httpx (for testing), pytest

#### [NEW] [run.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/run.py)
- Uvicorn launcher with hot reload

#### [NEW] [config.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/core/config.py)
- Settings: port, CORS origins, engine interval, queue max size, etc.

#### [NEW] [json_db.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/database/json_db.py)
- Thread-safe in-memory dict-of-lists database
- Collections: `products`, `bookings`, `members`, `ledger`, `campaigns`, `transaction_logs`, `queue_items`, `reliability_events`
- Methods: `get_all()`, `get_by_id()`, `insert()`, `update()`, `delete()`, `query(filter_fn)`
- Optional: auto-save to `data/db_snapshot.json` setiap N detik

#### [NEW] [seed.json](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/data/seed.json)
- Data awal produk (Beras Pandanwangi, Minyak Goreng, Gula Pasir, Tepung Terigu, Sabun Cair, Pupuk Urea, Pupuk NPK, Bibit Padi)
- Data awal member (Budi Hartono, Siti Aminah, Andi Wijaya, Yusuf Mansur)
- Saldo awal ledger
- Transaction log historis (untuk rolling-window analysis)

---

### Phase 2: Data Models (Pydantic)

#### [NEW] [product.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/product.py)
```python
class Product:
    id, name, category, stock, unit, purchase_price, selling_price,
    promo_price, discount_ai, stagnant_days, priority, is_dead_stock,
    last_transaction_date, created_at, version  # version for optimistic locking
```

#### [NEW] [booking.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/booking.py)
```python
class BookingStatus(Enum): PENDING, PROCESSING, CONFIRMED, COMPLETED, CANCELLED, FAILED

class Booking:
    id, booking_code, product_id, product_name, member_id, member_name,
    quantity, unit_price, total_price, status, idempotency_key,
    queue_position, created_at, updated_at, version
```

#### [NEW] [member.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/member.py)
```python
class Member:
    id, name, member_code, phone, savings_pokok, savings_wajib,
    savings_sukarela, active_status, joined_date
```

#### [NEW] [ledger.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/ledger.py)
```python
class LedgerEntry:
    id, timestamp, description, debit, credit, reference_type,
    reference_id, balance_after
```

#### [NEW] [campaign.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/campaign.py)
```python
class Campaign:
    id, product_id, product_name, campaign_type, discount_percentage,
    promo_price, urgency_score, message_template, target_members,
    status (PENDING/SENT/COMPLETED), created_at, sent_at
```

#### [NEW] [queue_item.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/queue_item.py)
```python
class QueueItem:
    id, booking_id, priority, status (QUEUED/PROCESSING/DONE/FAILED),
    enqueued_at, started_at, completed_at, retry_count
```

#### [NEW] [reliability.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/models/reliability.py)
```python
class ReliabilityEvent:
    id, event_type (DUPLICATE_REQUEST/RETRY/NETWORK_DELAY/CONCURRENT_BOOKING/
    OPTIMISTIC_LOCK_CONFLICT/IDEMPOTENCY_SUCCESS/QUEUE_BACKLOG),
    description, status, details, timestamp
```

---

### Phase 3: Simkopdes Ledger Service

#### [NEW] [ledger_service.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/services/ledger_service.py)
- **Product CRUD**: create, read, update, delete produk
- **Stock Management**: add_stock, deduct_stock (with optimistic locking via version field)
- **Transaction Logging**: record setiap mutasi stok & penjualan
- **Double-Entry Bookkeeping**: setiap transaksi menghasilkan pasangan debit-credit
- **Inventory Status**: query produk by status (dead stock, low stock, normal)

#### [NEW] [products.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/products.py)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products` | List semua produk |
| GET | `/api/products/{id}` | Detail produk |
| POST | `/api/products` | Tambah produk baru |
| PUT | `/api/products/{id}` | Update produk |
| DELETE | `/api/products/{id}` | Hapus produk |
| GET | `/api/products/dead-stock` | List produk dead stock |
| GET | `/api/inventory/status` | Inventory summary & KPIs |

#### [NEW] [ledger.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/ledger.py)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/ledger` | List semua entry ledger |
| GET | `/api/ledger/summary` | Ringkasan keuangan |
| GET | `/api/transaction-logs` | Log transaksi |

---

### Phase 4: Coop-Demand Engine

#### [NEW] [demand_engine.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/services/demand_engine.py)
- **Rolling-Window Analysis**: Hitung rata-rata penjualan per produk dalam N hari terakhir (window=30 hari)
- **Dead Stock Detection**: Produk dengan 0 transaksi dalam window → flag dead stock
- **Urgency Score Calculation**:
  ```
  urgency = (stagnant_days / 30) * 0.4 + (stock_value / max_stock_value) * 0.3 + (1 - demand_ratio) * 0.3
  ```
  Score 0-100, semakin tinggi semakin urgen untuk di-promo
- **Discount Recommendation**: Berdasarkan urgency score → tentukan persentase diskon
- **Campaign Generation**: Auto-generate campaign object dengan message template WA
- **Trigger to Gateway**: Push campaign ke API Gateway untuk di-blast

#### [NEW] [engine_scheduler.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/scheduler/engine_scheduler.py)
- Background task yang menjalankan demand engine setiap 30 detik
- Broadcast hasil analisis via WebSocket ke dashboard
- Log semua activity ke transaction_logs

---

### Phase 5: Queue System

#### [NEW] [booking_queue.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/queue/booking_queue.py)
- `asyncio.Queue` sebagai FIFO message broker
- **Worker coroutine** yang consume dari queue secara berurutan
- **Flow**: enqueue booking → validate stock → deduct stock → create ledger entries → update booking status
- **Race condition prevention**: asyncio.Lock pada operasi stok
- **Negative stock guard**: Reject booking jika stok tidak cukup
- **Queue metrics**: size, processed count, failed count, avg processing time
- Broadcast status changes via WebSocket

---

### Phase 6: API Gateway

#### [NEW] [gateway_service.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/services/gateway_service.py)
- **Idempotency Key Management**: Store & validate idempotency keys (TTL 5 menit)
- **Optimistic Locking**: Compare version field sebelum update
- **Duplicate Request Prevention**: Check idempotency key sebelum process
- **Rate Limiting**: Simple counter per endpoint

#### [NEW] [idempotency.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/utils/idempotency.py)
- In-memory store untuk idempotency keys
- Auto-cleanup expired keys

#### [NEW] [gateway.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/gateway.py)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/gateway/trigger-campaign` | Trigger campaign blast |
| POST | `/api/gateway/book` | Create booking (with idempotency) |
| POST | `/api/gateway/cancel-booking/{id}` | Cancel booking |
| POST | `/api/gateway/confirm-payment/{id}` | Konfirmasi pembayaran |
| POST | `/api/gateway/sync-ledger` | Force ledger sync |
| GET | `/api/gateway/health` | Gateway health check |
| GET | `/api/gateway/metrics` | Gateway reliability metrics |

#### [NEW] [bookings.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/bookings.py)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/bookings` | List semua booking |
| GET | `/api/bookings/{id}` | Detail booking |
| GET | `/api/bookings/active` | Booking yang sedang diproses |

---

### Phase 7: WebSocket Server

#### [NEW] [ws_manager.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/websocket/ws_manager.py)
- Connection manager: track connected clients per channel
- **Channels**:
  - `stock_updates` — perubahan stok real-time
  - `bookings` — booking baru, status change
  - `campaigns` — campaign baru
  - `queue_status` — queue size, processing status
  - `reliability` — reliability events & metrics
  - `activity_log` — system logs
  - `whatsapp` — messages for WhatsApp Mock

#### [NEW] [ws_routes.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/ws_routes.py)
| Protocol | URL | Description |
|----------|-----|-------------|
| WS | `/ws/dashboard` | Dashboard updates (all channels) |
| WS | `/ws/whatsapp/{member_id}` | WhatsApp mock per member |

---

### Phase 8: WhatsApp Mock Integration

#### [NEW] [whatsapp.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/whatsapp.py)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/whatsapp/campaigns` | List blast campaigns untuk member |
| POST | `/api/whatsapp/reply` | Kirim reply "Tebus" dari member |
| GET | `/api/whatsapp/bookings/{member_id}` | Status booking member |
| GET | `/api/whatsapp/products` | Katalog produk (untuk CatalogModal) |
| POST | `/api/whatsapp/book` | Direct booking dari WhatsApp |

---

### Phase 9: Command Center Integration

#### [NEW] [dashboard.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/dashboard.py)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/dashboard/inventory-insights` | KPIs: stagnant count, modal tertahan, potensi recovery |
| GET | `/api/dashboard/booking-queue` | Active booking queue data |
| GET | `/api/dashboard/ledger-sync` | Recent ledger entries |
| GET | `/api/dashboard/system-status` | System health (queue size, WS connections, uptime) |
| GET | `/api/dashboard/members` | Member list with savings |
| POST | `/api/dashboard/trigger-flash-sale` | Manual flash sale trigger |

---

### Phase 10: Reliability Simulation

#### [NEW] [reliability_service.py](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/services/reliability_service.py)
Simulasi yang dapat di-trigger dari dashboard:

| Simulation | Description |
|-----------|-------------|
| `duplicate_request` | Kirim 2 booking identik → yang kedua ditolak karena idempotency |
| `retry_request` | Simulate first request timeout, retry berhasil |
| `network_delay` | Tambah artificial delay 3-5 detik pada booking |
| `concurrent_booking` | 5 booking simultan untuk produk dengan stok 3 → 3 berhasil, 2 gagal |
| `optimistic_lock_conflict` | 2 update stok bersamaan → yang kedua conflict |
| `idempotency_success` | Retry dengan key yang sama → return cached response |
| `queue_backlog` | Flood 10 booking sekaligus → queue processes sequentially |

#### [NEW] [reliability.py (API)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-backend/app/api/reliability.py)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/simulate/{scenario}` | Run simulation scenario |
| GET | `/api/simulate/results` | List all simulation results |
| GET | `/api/simulate/metrics` | Aggregated reliability metrics |

---

### Phase 11: Frontend Modifications

#### [MODIFY] [vite.config.ts (simkopdes-chat)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-chat/vite.config.ts)
- Tambah proxy: `/api` → `http://localhost:8000`
- Tambah proxy: `/ws` → `ws://localhost:8000`

#### [MODIFY] [server.ts (simkopdes-chat)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-chat/server.ts)
- Hapus semua mock data dan API endpoints
- Hanya jadi Vite dev server (proxy ke backend)
- Pertahankan Gemini AI chat endpoint (karena spesifik frontend)

#### [MODIFY] [App.tsx (simkopdes-chat)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-chat/src/App.tsx)
- Connect WebSocket ke `/ws/whatsapp/member-1`
- Handle incoming campaign blast messages
- Booking via `/api/gateway/book` dengan idempotency key
- Real-time booking status updates via WS

#### [MODIFY] [vite.config.ts (simkopdes-enterprise-console)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-enterprise-console/vite.config.ts)
- Pindah ke port 3001
- Tambah proxy: `/api` → `http://localhost:8000`
- Tambah proxy: `/ws` → `ws://localhost:8000`

#### [MODIFY] [server.ts (simkopdes-enterprise-console)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-enterprise-console/server.ts)
- Pindah ke port 3001
- Hapus mock AI endpoints, proxy ke backend
- Pertahankan Gemini AI endpoint (spesifik console)

#### [MODIFY] [App.tsx (simkopdes-enterprise-console)](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-enterprise-console/src/App.tsx)
- Fetch initial data dari backend API
- Connect WebSocket ke `/ws/dashboard`
- Real-time updates untuk: products, bookings, ledger, queue status
- System status bar: data real dari backend

#### [MODIFY] [CommandCenterTab.tsx](file:///c:/Users/ananda.ramadhan_izen/Documents/Project/hackathon/simkopdes-enterprise-console/src/components/CommandCenterTab.tsx)
- Flash Sale trigger → call `/api/gateway/trigger-campaign`
- Booking queue → real-time via WS
- Ledger sync → real-time via WS

---

## Implementation Execution Order

| Phase | Tahap | Deskripsi |
|-------|-------|-----------|
| 1 | Foundation | Project structure, config, JSON DB, seed data |
| 2 | Models | Semua Pydantic models |
| 3 | Ledger | Product CRUD, stock management, double-entry ledger |
| 4 | Engine | Coop-Demand Engine + scheduler |
| 5 | Queue | asyncio.Queue FIFO booking processor |
| 6 | Gateway | Idempotency, optimistic locking, gateway endpoints |
| 7 | WebSocket | WS manager + broadcast channels |
| 8 | WhatsApp | WhatsApp Mock integration endpoints |
| 9 | Dashboard | Command Center data endpoints |
| 10 | Reliability | Simulation scenarios |
| 11 | Frontend | Modify both frontends to connect to backend |
| 12 | E2E Test | End-to-end testing |

---

## Verification Plan

### Automated Tests
```bash
cd simkopdes-backend
pytest tests/ -v
```

### Manual Verification
1. **Start backend**: `python run.py` → verify health check at `http://localhost:8000/api/health`
2. **Start chat frontend**: `npm run dev` di `simkopdes-chat` → verify proxy ke backend
3. **Start console frontend**: `npm run dev` di `simkopdes-enterprise-console` → verify proxy ke backend
4. **E2E Flow**:
   - Demand engine mendeteksi dead stock → generate campaign
   - Campaign di-blast ke WhatsApp Mock via WebSocket
   - User reply "Tebus" → booking masuk ke queue
   - Queue process booking → stok berkurang → ledger sync
   - Dashboard menampilkan semua perubahan real-time
5. **Reliability**: Trigger semua simulasi dari dashboard → visualisasi di Tech Console
