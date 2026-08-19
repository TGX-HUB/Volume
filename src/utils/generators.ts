import { ScraperConfig } from '../types';

export function generateRepeatedFetchScript(config: ScraperConfig): string {
  const pollSec = (config.pollIntervalMs / 1000).toFixed(3);
  return `"""
Pump.fun Volume Scraper - Repeated Fetch Poller (Scrapling DynamicSession)
Target Token: ${config.tokenAddress}
Check Interval: ${config.pollIntervalMs}ms (${pollSec}s)
"""

import re
import time
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from scrapling.fetchers import DynamicSession

# ============================================================
# CONFIGURATION
# ============================================================

TOKEN_ADDRESS = "${config.tokenAddress}"
PUMP_URL = f"https://pump.fun/coin/{TOKEN_ADDRESS}"

# Requested polling interval (Seconds)
POLL_INTERVAL_SECONDS = ${pollSec}

# Browser settings
HEADLESS = ${config.headless ? 'True' : 'False'}

# Print every check? False = print only when volume changes
PRINT_EVERY_CHECK = ${config.printEveryCheck ? 'True' : 'False'}

# Optional minimum delta threshold in USD to trigger log output
MIN_DELTA_THRESHOLD = ${config.minDeltaAlert.toFixed(2)}


# ============================================================
# HELPERS
# ============================================================

def utc_timestamp():
    """High-resolution UTC timestamp."""
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def clean_text(value):
    """Normalize scraped text."""
    if value is None:
        return ""
    return re.sub(r"\\s+", " ", str(value)).strip()


def parse_money(value):
    """
    Convert strings such as:
        $123,456.78
        $1.2M
        123456.78
    into Decimal.
    """
    if value is None:
        return None

    text = clean_text(value)
    if not text:
        return None

    text = text.replace("$", "").replace(",", "").strip()

    multiplier = Decimal("1")
    if text[-1:].upper() == "K":
        multiplier = Decimal("1000")
        text = text[:-1]
    elif text[-1:].upper() == "M":
        multiplier = Decimal("1000000")
        text = text[:-1]
    elif text[-1:].upper() == "B":
        multiplier = Decimal("1000000000")
        text = text[:-1]

    try:
        return Decimal(text) * multiplier
    except InvalidOperation:
        return None


def format_volume(volume):
    if volume is None:
        return "UNKNOWN"
    return f"\${volume:,.2f}"


# ============================================================
# VOLUME EXTRACTION
# ============================================================

def extract_volume_from_page(page):
    """
    Attempts to find token volume from the rendered Pump.fun page.
    Uses multi-pattern fallback strategy.
    """
    try:
        body_text = clean_text(page.css("body::text").getall())
    except Exception:
        body_text = ""

    if not body_text:
        try:
            body_text = clean_text(page.text)
        except Exception:
            body_text = ""

    if not body_text:
        return None

    # Multi-pattern regex search
    patterns = [
        r"volume\\s*[:\\-]?\\s*\\$?\\s*([\\d,]+(?:\\.\\d+)?[KMB]?)",
        r"vol\\.?\\s*[:\\-]?\\s*\\$?\\s*([\\d,]+(?:\\.\\d+)?[KMB]?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, body_text, flags=re.IGNORECASE)
        if match:
            val = parse_money(match.group(1))
            if val is not None:
                return val

    # DOM search fallback
    try:
        for element in page.css("*"):
            try:
                text = clean_text(element.text)
            except Exception:
                continue

            if not text or "volume" not in text.lower():
                continue

            match = re.search(
                r"(?:volume|vol\\.?)\\s*[:\\-]?\\s*\\$?\\s*([\\d,]+(?:\\.\\d+)?[KMB]?)",
                text,
                flags=re.IGNORECASE
            )
            if match:
                val = parse_money(match.group(1))
                if val is not None:
                    return val
    except Exception:
        pass

    return None


# ============================================================
# SCRAPER ENGINE
# ============================================================

class PumpVolumeScraper:
    def __init__(self, token_address):
        self.token_address = token_address.strip()
        self.url = f"https://pump.fun/coin/{self.token_address}"
        self.last_volume = None
        self.session = None

    def start(self):
        print("=" * 70)
        print("PUMP.FUN VOLUME SCRAPER (REPEATED FETCH)")
        print("=" * 70)
        print(f"Token : {self.token_address}")
        print(f"URL   : {self.url}")
        print(f"Poll  : {POLL_INTERVAL_SECONDS * 1000:.0f} ms")
        print()
        print("Starting persistent Scrapling browser...")

        self.session = DynamicSession(
            headless=HEADLESS,
            disable_resources=False,
            network_idle=False,
        )
        self.session.__enter__()

    def monitor(self):
        print("Loading Pump.fun token page...")
        self.session.fetch(self.url, load_dom=True)
        print("Page loaded successfully.")
        print("=" * 70)
        print("MONITORING ACTIVE - Press CTRL+C to stop.")
        print("=" * 70)

        next_check = time.perf_counter()

        try:
            while True:
                next_check += POLL_INTERVAL_SECONDS
                
                try:
                    page = self.session.fetch(self.url, load_dom=True)
                    volume = extract_volume_from_page(page)
                except Exception as err:
                    print(f"[{utc_timestamp()}] [SCRAPE ERROR] {err}")
                    volume = None

                now = utc_timestamp()
                changed = (volume is not None and volume != self.last_volume)

                if changed or PRINT_EVERY_CHECK:
                    print(f"[{now}] Volume: {format_volume(volume)}")

                if changed and self.last_volume is not None:
                    delta = volume - self.last_volume
                    if abs(delta) >= MIN_DELTA_THRESHOLD:
                        pct = ((delta / self.last_volume) * 100) if self.last_volume > 0 else 0
                        print(f"             Change: {delta:+,.2f} ({pct:+.2f}%)")

                if volume is not None:
                    self.last_volume = volume

                remaining = next_check - time.perf_counter()
                if remaining > 0:
                    time.sleep(remaining)
                else:
                    next_check = time.perf_counter()

        except KeyboardInterrupt:
            print("\\nStopping scraper...")
        finally:
            self.close()

    def close(self):
        if self.session is not None:
            try:
                self.session.__exit__(None, None, None)
            except Exception:
                pass
            self.session = None
        print("Scraper closed.")


if __name__ == "__main__":
    scraper = PumpVolumeScraper(TOKEN_ADDRESS)
    scraper.start()
    scraper.monitor()
`;
}

export function generateDomObserverScript(config: ScraperConfig): string {
  return `"""
Pump.fun Volume Scraper - Single Persistent Page + DOM MutationObserver
Zero network refetch overhead. Operates via browser client-side evaluation & DOM events.
Target Token: ${config.tokenAddress}
"""

import asyncio
import json
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from playwright.async_api import async_playwright

TOKEN_ADDRESS = "${config.tokenAddress}"
PUMP_URL = f"https://pump.fun/coin/{TOKEN_ADDRESS}"
HEADLESS = ${config.headless ? 'True' : 'False'}
MIN_DELTA_THRESHOLD = ${config.minDeltaAlert.toFixed(2)}


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def parse_money(value):
    if not value:
        return None
    text = re.sub(r"\\s+", " ", str(value)).replace("$", "").replace(",", "").strip()
    multiplier = Decimal("1")
    if text[-1:].upper() == "K":
        multiplier = Decimal("1000")
        text = text[:-1]
    elif text[-1:].upper() == "M":
        multiplier = Decimal("1000000")
        text = text[:-1]
    elif text[-1:].upper() == "B":
        multiplier = Decimal("1000000000")
        text = text[:-1]

    try:
        return Decimal(text) * multiplier
    except InvalidOperation:
        return None


class PumpDomObserver:
    def __init__(self, token_address):
        self.token_address = token_address
        self.url = f"https://pump.fun/coin/{self.token_address}"
        self.last_volume = None
        self.tick_count = 0

    async def on_volume_mutation(self, raw_payload):
        now = utc_timestamp()
        self.tick_count += 1
        
        try:
            data = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload
            raw_text = data.get("text", "")
            volume = parse_money(raw_text)
            
            if volume is None:
                return

            if volume != self.last_volume:
                if self.last_volume is not None:
                    delta = volume - self.last_volume
                    pct = (delta / self.last_volume) * 100 if self.last_volume > 0 else 0
                    print(f"[{now}] Volume: \${volume:,.2f} | Delta: {delta:+,.2f} ({pct:+.2f}%) [DOM Mutation #{self.tick_count}]")
                else:
                    print(f"[{now}] Initial Volume: \${volume:,.2f}")
                
                self.last_volume = volume
        except Exception as e:
            print(f"[{now}] Error processing DOM tick: {e}")

    async def run(self):
        print("=" * 70)
        print("PUMP.FUN PERSISTENT DOM MUTATION OBSERVER")
        print("=" * 70)
        print(f"Token : {self.token_address}")
        print(f"URL   : {self.url}")
        print("Mode  : Persistent Page with MutationObserver (Sub-millisecond DOM trigger)")
        print()

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=HEADLESS,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context.new_page()

            await page.expose_binding(
                "pyOnVolumeUpdate",
                lambda source, val: asyncio.create_task(self.on_volume_mutation(val))
            )

            print("Navigating to token page...")
            await page.goto(self.url, wait_until="domcontentloaded")
            print("Page loaded. Injecting DOM MutationObserver...")

            await page.evaluate("""() => {
                const extractVolume = () => {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                    let node;
                    while ((node = walker.nextNode())) {
                        const txt = node.textContent || '';
                        if (/volume|vol/i.test(txt)) {
                            const match = txt.match(/\\$?[\\d,]+(?:\\.\\d+)?[KMB]?/i);
                            if (match) return match[0];
                        }
                    }
                    return null;
                };

                let lastSeen = extractVolume();
                if (lastSeen) {
                    window.pyOnVolumeUpdate({ text: lastSeen, type: 'init' });
                }

                const observer = new MutationObserver((mutations) => {
                    const current = extractVolume();
                    if (current && current !== lastSeen) {
                        lastSeen = current;
                        window.pyOnVolumeUpdate({ text: current, type: 'mutation' });
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });

                setInterval(() => {
                    const current = extractVolume();
                    if (current && current !== lastSeen) {
                        lastSeen = current;
                        window.pyOnVolumeUpdate({ text: current, type: 'interval' });
                    }
                }, 10);
            }""")

            print("=" * 70)
            print("DOM OBSERVER RUNNING - Listening for live changes...")
            print("=" * 70)

            try:
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                print("\\nClosing DOM observer...")
            finally:
                await browser.close()


if __name__ == "__main__":
    observer = PumpDomObserver(TOKEN_ADDRESS)
    try:
        asyncio.run(observer.run())
    except KeyboardInterrupt:
        print("Terminated.")
`;
}

export function generateWebSocketStreamerScript(config: ScraperConfig): string {
  return `"""
Pump.fun Volume Tracker - Version 3: Direct WebSocket / RPC Event Streamer
Bypasses browser rendering entirely. Connects directly to real-time Solana trade streams.
Target Token: ${config.tokenAddress}
"""

import asyncio
import json
import websockets
from datetime import datetime, timezone

TOKEN_ADDRESS = "${config.tokenAddress}"
PUMP_WS_URL = "wss://pumpportal.fun/api/data"

def utc_timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")

async def stream_pump_trades():
    print("=" * 70)
    print("PUMP.FUN DIRECT WEBSOCKET TRADE STREAMER")
    print("=" * 70)
    print(f"Token : {TOKEN_ADDRESS}")
    print(f"WS URL: {PUMP_WS_URL}")
    print("Connecting directly to on-chain trade feed (0ms browser overhead)...")
    print()

    total_volume_sol = 0.0
    total_trades = 0

    async with websockets.connect(PUMP_WS_URL) as ws:
        payload = {
            "method": "subscribeTokenTrade",
            "keys": [TOKEN_ADDRESS]
        }
        await ws.send(json.dumps(payload))
        print("Subscribed! Listening for on-chain buy/sell events...")
        print("=" * 70)

        while True:
            try:
                msg = await ws.recv()
                data = json.loads(msg)
                
                if "solAmount" in data:
                    total_trades += 1
                    sol_amount = float(data.get("solAmount", 0))
                    tx_type = data.get("txType", "trade").upper()
                    total_volume_sol += sol_amount
                    
                    now = utc_timestamp()
                    print(f"[{now}] {tx_type:4s} | {sol_amount:8.3f} SOL | Total Vol: {total_volume_sol:,.2f} SOL [Tx #{total_trades}]")
            except Exception as err:
                print(f"Stream error: {err}")
                await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(stream_pump_trades())
    except KeyboardInterrupt:
        print("\\nStream stopped.")
`;
}

export function generateSetupBatch(): string {
  return `@echo off
echo ========================================================
echo PUMP.FUN SCRAPER ENVIRONMENT SETUP (WINDOWS)
echo ========================================================

python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3.10+ is required. Please install from python.org
    pause
    exit /b
)

if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\\Scripts\\activate

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing Scrapling with fetchers and Playwright...
pip install "scrapling[fetchers]" playwright websockets
scrapling install
playwright install chromium

echo ========================================================
echo Setup complete! Run your script with:
echo    python pump_volume_scraper.py
echo    python pump_dom_observer.py
echo ========================================================
pause
`;
}

export function generateRequirementsTxt(): string {
  return `scrapling[fetchers]>=0.2.0
playwright>=1.40.0
websockets>=12.0
`;
}
