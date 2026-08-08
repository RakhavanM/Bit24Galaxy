#!/usr/bin/env python3
"""Create the Phase 1 asset snapshot from Bit24's public coin table.

The generated snapshot is intentionally static: the first release has no live
price updates and can be deployed to GitHub Pages without a backend.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
ICON_DIR = ROOT / "public" / "coin-icons"
SOURCE_URL = "https://bit24.cash/coins/"
USER_AGENT = "Bit24Galaxy/0.1 (+https://github.com/RakhavanM/Bit24Galaxy)"

# Phase 1 uses semantic tags rather than pretending every exchange asset has a
# single category. A coin can therefore appear in multiple constellations.
CATEGORY_TAGS: dict[str, list[str]] = {
    "BTC": ["core", "networks", "defi"],
    "ETH": ["core", "networks", "defi"],
    "USDT": ["stablecoins", "core"],
    "BNB": ["core", "networks", "exchange", "defi"],
    "USDC": ["stablecoins", "defi"],
    "XRP": ["core", "networks"],
    "SOL": ["core", "networks", "defi"],
    "TRX": ["networks"],
    "STETH": ["defi", "networks"],
    "HYPE": ["exchange", "defi"],
    "DOGE": ["memes"],
    "RAIN": ["rwa"],
    "LEO": ["exchange"],
    "ZEC": ["privacy"],
    "WBTC": ["defi"],
    "ADA": ["networks"],
    "XMR": ["privacy"],
    "LINK": ["defi", "networks", "ai"],
    "XLM": ["networks"],
    "BCH": ["networks"],
    "USD1": ["stablecoins"],
    "USDE": ["stablecoins", "defi"],
    "GRAM": ["networks"],
    "CC": ["networks", "rwa"],
    "LTC": ["networks"],
    "USDG": ["stablecoins"],
    "HBAR": ["networks", "ai"],
    "SUI": ["networks", "defi"],
    "AVAX": ["networks", "defi"],
    "PYUSD": ["stablecoins"],
    "SHIB": ["memes"],
    "XAUT": ["rwa"],
    "UNI": ["defi"],
    "CRO": ["exchange", "defi"],
    "TAO": ["ai"],
    "NEAR": ["networks", "ai", "defi"],
    "OKB": ["exchange"],
    "PAXG": ["rwa"],
    "ONDO": ["rwa", "defi"],
    "ASTER": ["defi"],
    "WLFI": ["rwa", "defi"],
    "HTX": ["exchange"],
    "RLUSD": ["stablecoins"],
    "M": ["memes"],
    "MNT": ["networks", "defi"],
    "AAVE": ["defi"],
    "DOT": ["networks"],
    "SKY": ["defi", "stablecoins"],
    "ICP": ["networks", "ai"],
    "BFUSD": ["stablecoins", "defi"],
}


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=45) as response:
        return response.read()


def clean_number(text: str) -> float | None:
    value = text.replace(",", "").replace("٬", "").replace("٫", ".")
    value = re.sub(r"[^0-9.\-]", "", value)
    try:
        return float(value) if value else None
    except ValueError:
        return None


def main() -> int:
    html = fetch(SOURCE_URL)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table is None:
        raise RuntimeError("Could not find the public Bit24 coin table")

    coins: list[dict] = []
    for rank, row in enumerate(table.find_all("tr")[1:51], start=1):
        cells = row.find_all("td")
        link = row.find("a", href=re.compile(r"/coins/"))
        image = row.find("img")
        if len(cells) < 4 or link is None or image is None:
            continue
        text = row.get_text(" ", strip=True)
        parts = [part.strip() for part in text.split(" ") if part.strip()]
        symbol = image.get("alt", "").strip().upper()
        if not symbol:
            symbol = cells[0].get_text(" ", strip=True).split()[0].upper()
        name_fa = cells[0].get_text(" ", strip=True)
        # The first cell contains the symbol and Persian name; remove the
        # symbol from the beginning while retaining the original local label.
        name_fa = re.sub(rf"^{re.escape(symbol)}\s*", "", name_fa, flags=re.I).strip()
        row_text = [cell.get_text(" ", strip=True) for cell in cells]
        market_cap = clean_number(row_text[3])
        change = clean_number(row_text[2])
        price = clean_number(row_text[1])
        icon_src = image.get("src", "")
        icon_src = str(icon_src) if icon_src else ""
        icon_url = urljoin(SOURCE_URL, quote(icon_src, safe="/:"))
        href = link.get("href", "")
        href = str(href) if href else ""
        slug = href.strip("/").split("/")[-1]
        if not symbol or market_cap is None or not slug or not icon_url:
            continue
        coins.append(
            {
                "rank": rank,
                "symbol": symbol,
                "nameFa": name_fa or symbol,
                "nameEn": symbol,
                "slug": slug,
                "marketCap": market_cap,
                "marketCapCurrency": "USDT",
                "change24h": change,
                "priceIrt": price,
                "categories": CATEGORY_TAGS.get(symbol, ["core"]),
                "iconUrl": icon_url,
                "bit24Url": f"https://bit24.cash/coins/{slug}/",
            }
        )

    if len(coins) != 50:
        raise RuntimeError(f"Expected 50 rows, found {len(coins)}")

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    snapshot = {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "source": SOURCE_URL,
        "selection": "First 50 rows of Bit24's public market-cap table",
        "note": "Static Phase 1 snapshot. Prices are contextual only and are not live data.",
        "coins": coins,
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "coins.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for coin in coins:
        destination = ICON_DIR / f"{coin['symbol'].lower()}.png"
        try:
            destination.write_bytes(fetch(coin["iconUrl"]))
        except Exception as exc:  # Keep the source URL as a fallback in the app.
            print(f"warning: could not download {coin['symbol']} icon: {exc}", file=sys.stderr)

    print(f"Wrote {len(coins)} coins to {DATA_DIR / 'coins.json'}")
    print(f"Snapshot time: {generated_at}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


# The category table is also exported for the frontend's reproducibility notes.
# Keep this below the entrypoint so running the script remains straightforward.
CATEGORY_TAGS_JSON = CATEGORY_TAGS
