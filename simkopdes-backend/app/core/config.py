"""
Application Configuration & Constants
Centralized settings for the Simkopdes backend system.
"""
from pathlib import Path

# === Server ===
APP_TITLE = "Simkopdes Backend API"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Backend system for Simkopdes Cooperative Management"
HOST = "0.0.0.0"
PORT = 8000

# === CORS ===
# Allow both frontend dev servers
CORS_ORIGINS = [
    "http://localhost:3000",   # simkopdes-chat
    "http://localhost:3001",   # simkopdes-enterprise-console
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# === Paths ===
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SEED_FILE = DATA_DIR / "seed.json"
DB_SNAPSHOT_FILE = DATA_DIR / "db_snapshot.json"

# === Coop-Demand Engine ===
ENGINE_AUTO_RUN = False               # Disable automatic scheduler for manual demo trigger
ENGINE_INTERVAL_SECONDS = 86400       # Practically never runs automatically (1 day)
ROLLING_WINDOW_DAYS = 30              # Analysis window for demand calculation
DEAD_STOCK_THRESHOLD_DAYS = 30        # Days with no sales → dead stock
URGENCY_WEIGHT_STAGNANT = 0.4         # Weight for stagnant_days in urgency score
URGENCY_WEIGHT_STOCK_VALUE = 0.3      # Weight for stock value ratio
URGENCY_WEIGHT_DEMAND = 0.3           # Weight for inverse demand ratio

# === Queue ===
QUEUE_MAX_SIZE = 100                  # Maximum items in booking queue
QUEUE_PROCESSING_DELAY = 1.5          # Simulated processing delay (seconds)

# === Idempotency ===
IDEMPOTENCY_TTL_SECONDS = 300         # Idempotency key TTL (5 minutes)
IDEMPOTENCY_CLEANUP_INTERVAL = 60     # Cleanup expired keys every N seconds

# === Rate Limiting ===
RATE_LIMIT_WINDOW_SECONDS = 2         # Minimum interval between duplicate requests
RATE_LIMIT_MAX_PER_MINUTE = 60        # Max requests per minute per endpoint

# === Optimistic Locking ===
MAX_RETRY_ON_CONFLICT = 3             # Max retries when version conflict detected

# === Reliability Simulation ===
SIMULATION_NETWORK_DELAY_MIN = 2.0    # Min network delay simulation (seconds)
SIMULATION_NETWORK_DELAY_MAX = 5.0    # Max network delay simulation (seconds)
SIMULATION_CONCURRENT_COUNT = 5       # Number of concurrent bookings in simulation
SIMULATION_BACKLOG_COUNT = 10         # Number of items for queue backlog simulation

# === WebSocket ===
WS_HEARTBEAT_INTERVAL = 15           # Heartbeat ping interval (seconds)

# === Discount Recommendation Tiers ===
# Based on urgency score: (min_score, max_score, discount_percentage)
DISCOUNT_TIERS = [
    (0, 30, 5),
    (30, 50, 8),
    (50, 70, 12),
    (70, 85, 15),
    (85, 100, 20),
]
