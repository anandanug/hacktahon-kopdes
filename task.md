# Simkopdes Backend — Task Tracker

## Phase 1: Project Foundation
- [x] Create project structure & `__init__.py` files
- [x] Create `requirements.txt`
- [x] Create `run.py` (Uvicorn launcher)
- [x] Create `app/core/config.py` (Settings)
- [x] Create `app/core/events.py` (Event bus)
- [x] Create `app/database/json_db.py` (JSON In-Memory DB)
- [x] Create `data/seed.json` (Initial data)
- [x] Create `app/main.py` (FastAPI entry point)
- [x] Test: Server starts successfully

## Phase 2: Data Models
- [x] Create `app/models/product.py`
- [x] Create `app/models/booking.py`
- [x] Create `app/models/member.py`
- [x] Create `app/models/ledger.py`
- [x] Create `app/models/campaign.py`
- [x] Create `app/models/queue_item.py`
- [x] Create `app/models/reliability.py`

## Phase 3: Simkopdes Ledger
- [x] Create `app/services/ledger_service.py`
- [x] Create `app/api/products.py`
- [x] Create `app/api/ledger.py`
- [x] Create `app/api/members.py`
- [x] Test: CRUD operations work

## Phase 4: Coop-Demand Engine
- [x] Create `app/services/demand_engine.py`
- [x] Create `app/services/campaign_service.py`
- [x] Create `app/scheduler/engine_scheduler.py`
- [x] Create `app/api/campaigns.py`
- [x] Test: Engine detects dead stock

## Phase 5: Queue System
- [x] Create `app/queue/booking_queue.py`
- [x] Create `app/services/booking_service.py`
- [x] Test: FIFO processing works

## Phase 6: API Gateway
- [x] Create `app/utils/idempotency.py`
- [x] Create `app/services/gateway_service.py`
- [x] Create `app/api/gateway.py`
- [x] Create `app/api/bookings.py`
- [x] Test: Idempotency & optimistic locking

## Phase 7: WebSocket Server
- [x] Create `app/websocket/ws_manager.py`
- [x] Create `app/api/ws_routes.py`
- [x] Test: WS connections & broadcasts

## Phase 8: WhatsApp Mock Integration
- [x] Create `app/api/whatsapp.py`
- [x] Test: Campaign blast & reply flow

## Phase 9: Command Center Integration
- [x] Create `app/api/dashboard.py`
- [x] Test: Dashboard data endpoints

## Phase 10: Reliability Simulation
- [x] Create `app/services/reliability_service.py`
- [x] Create `app/api/reliability.py`
- [x] Test: All 7 simulation scenarios

## Phase 11: Frontend Modifications
- [x] Modify simkopdes-chat vite.config.ts
- [x] Modify simkopdes-chat server.ts
- [x] Modify simkopdes-chat App.tsx
- [x] Modify simkopdes-enterprise-console vite.config.ts
- [x] Modify simkopdes-enterprise-console server.ts

## Phase 12: End-to-End Testing
- [/] Full flow test: dead stock → campaign → booking → ledger
- [ ] Reliability simulation test
- [ ] Create walkthrough document
