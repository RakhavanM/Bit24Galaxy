#!/usr/bin/env python3
"""Create the exact Bit24Galaxy asset snapshot from Bit24's public pages/API.

The v0.2 taxonomy is editorial: it intentionally contains 50 requested symbols
across eight galaxies. The script prefers the public Bit24 coin detail page for
market data and falls back to Bit24's public OTC coin endpoint when a detail
page is unavailable.
"""
from __future__ import annotations

import concurrent.futures
import json
import re
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
ICON_DIR = ROOT / "public" / "coin-icons"
COINS_URL = "https://bit24.cash/coins/"
OTC_API = "https://otc-api.bit24.cash/api/v1/coins/price"
USER_AGENT = "Bit24Galaxy/0.2 (+https://github.com/RakhavanM/Bit24Galaxy)"

REQUESTED_GROUPS: "OrderedDict[str, list[str]]" = OrderedDict(
    [
        ("core", ["BTC", "ETH", "SOL", "ADA", "TON", "AVAX", "DOT"]),
        ("stablecoins", ["USDT", "USDC", "DAI", "FDUSD", "USDE", "TUSD"]),
        ("defi", ["UNI", "AAVE", "MKR", "CRV", "LDO", "SNX"]),
        ("layer2", ["ARB", "OP", "STRK", "MNT", "ZK", "MANTA"]),
        ("ai", ["TAO", "RNDR", "FET", "AKT", "IO", "GRT"]),
        ("gamefi", ["AXS", "SAND", "MANA", "GALA", "BEAM", "ENJ"]),
        ("exchange", ["BNB", "OKB", "KCS", "BGB", "CRO", "LEO"]),
        ("memes", ["DOGE", "SHIB", "PEPE", "WIF", "FLOKI", "BONK", "BRETT"]),
    ]
)

# RNDR is the requested legacy symbol; Bit24's current public asset is RENDER.
PAGE_SLUGS = {"RNDR": "render"}
SOURCE_SYMBOLS = {"RNDR": "RENDER"}
CATEGORY_TAGS = {symbol: [category] for category, symbols in REQUESTED_GROUPS.items() for symbol in symbols}


def session() -> requests.Session:
    client = requests.Session()
    client.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/json"})
    return client


def number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).replace(",", "").replace("٬", "").replace("٫", ".")
    text = re.sub(r"[^0-9.\-]", "", text)
    try:
        return float(text) if text else None
    except ValueError:
        return None


def compact(value: str | None) -> float | None:
    if not value:
        return None
    text = str(value).replace(",", "").replace("٬", "")
    match = re.search(r"(-?[0-9]+(?:\.[0-9]+)?)\s*([KMBT])?", text, re.I)
    if not match:
        return number(text)
    multiplier = {"K": 1e3, "M": 1e6, "B": 1e9, "T": 1e12}.get((match.group(2) or "").upper(), 1)
    return float(match.group(1)) * multiplier


def pairs(soup: BeautifulSoup) -> dict[str, str]:
    titles = [node.get_text(" ", strip=True) for node in soup.select(".coin-market__title")]
    values = [node.get_text(" ", strip=True) for node in soup.select(".coin-market__value")]
    return dict(zip(titles, values))


def primary_page_payload(html: str, icon_url: str, source_symbol: str) -> tuple[float | None, float | None, float | None]:
    raw = html.replace('\\"', '"').replace('\\/', '/')
    start = raw.find(icon_url) if icon_url else 0
    window = raw[max(0, start) : max(0, start) + 250_000]
    window = window.replace('\\\\u002F', '/').replace('\\\\/', '/')
    pattern = re.compile(
        r'"' + re.escape(source_symbol) + r'"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([-0-9.]+)"\s*,\s*"([-0-9.]+)"\s*,\s*"([^"}]*)"',
        re.I,
    )
    match = pattern.search(window)
    if not match:
        # Standard detail payload: symbol, English name, Persian name, icon,
        # daily change, USDT change, USD price, IRT price.
        pattern = re.compile(
            r'"' + re.escape(source_symbol) + r'"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[-0-9.]+"\s*,\s*"([-0-9.]+)"\s*,\s*"([-0-9.]+)"\s*,\s*"([-0-9.]+)"',
            re.I,
        )
        match = pattern.search(window)
    if not match:
        return None, None, None
    values = [number(value) for value in match.groups()]
    if len(values) == 3 and values[2] is not None:
        # First pattern returns IRT price, USD price, change.
        return values[0], values[1], values[2]
    return None, None, None


def page_record(requested: str) -> dict[str, Any] | None:
    source = SOURCE_SYMBOLS.get(requested, requested)
    slug = PAGE_SLUGS.get(requested, requested.lower())
    response = session().get(f"https://bit24.cash/coins/{slug}/", timeout=45)
    if response.status_code != 200 or "صفحه مورد نظر یافت نشد" in response.text:
        return None
    soup = BeautifulSoup(response.text, "html.parser")
    info = pairs(soup)
    primary = soup.select_one('img[alt="primary coin image"]')
    icon = str(primary.get("src")) if primary and primary.get("src") else ""
    price_irt, _price_usd, change = primary_page_payload(response.text, icon, source)
    # For pages whose embedded payload is compressed/encoded, the visible offer
    # and market blocks still provide a reliable market-cap and price fallback.
    if price_irt is None:
        offer = re.search(r'"priceCurrency":"IRR","price":([0-9.]+)', response.text)
        price_irt = number(offer.group(1)) if offer else None
    market_cap = compact(info.get("ارزش بازار")) or 0
    # Some legacy pages expose a stale/zero market-cap card. The embedded
    # payload has the authoritative numeric market_cap in the detail object.
    raw = response.text.replace('\\\\u002F', '/').replace('\\\\/', '/')
    detail_start = raw.find(f'"{source}"')
    detail_window = raw[detail_start : detail_start + 2400] if detail_start >= 0 else ""
    cap_match = re.search(r'"market_cap":\d+[^,]*,?\s*"(?:type|markets)"|market_cap[^,]{0,80}', detail_window)
    quoted_caps = re.findall(r'"([0-9]{4,})"', detail_window)
    if market_cap == 0 and quoted_caps:
        # In the detail block the market cap follows the asset markets object;
        # prefer the largest plausible numeric value in the compact payload.
        candidates = [float(value) for value in quoted_caps if float(value) >= 1_000_000]
        if candidates:
            market_cap = max(candidates)
    return {
        "requested": requested,
        "sourceSymbol": source,
        "slug": slug,
        "nameFa": info.get("نام فارسی") or requested,
        "nameEn": info.get("نام انگلیسی") or source,
        "marketCap": market_cap,
        "priceIrt": price_irt,
        "change24h": change,
        "rank": int(number(info.get("رتبه بازار")) or 0),
        "iconUrl": icon,
        "bit24Url": f"https://bit24.cash/coins/{slug}/",
        "sourceType": "public-coin-page",
    }


def api_record(requested: str) -> dict[str, Any] | None:
    source = SOURCE_SYMBOLS.get(requested, requested)
    response = session().get(
        OTC_API,
        params={"changes": "changes", "page": 1, "per_page": 50, "search": source, "market": "IRT", "sort_by": "market_cap"},
        timeout=45,
    )
    response.raise_for_status()
    rows = response.json().get("data", {}).get("results", [])
    row = next((item for item in rows if str(item.get("symbol", "")).upper() == source.upper()), None)
    if not row:
        return None
    return {
        "requested": requested,
        "sourceSymbol": source,
        "slug": row.get("slug") or requested.lower(),
        "nameFa": row.get("fa_name") or requested,
        "nameEn": source,
        "marketCap": number(row.get("market_cap")) or 0,
        "priceIrt": number(row.get("each_price")),
        "change24h": number(row.get("changes")),
        "rank": 0,
        "iconUrl": row.get("icon") or "",
        "bit24Url": f"https://bit24.cash/coins/{row.get('slug') or requested.lower()}/",
        "sourceType": "public-otc-api",
    }


def get_record(requested: str) -> dict[str, Any]:
    return page_record(requested) or api_record(requested) or (_ for _ in ()).throw(RuntimeError(f"Missing Bit24 public asset: {requested}"))


def download_icon(coin: dict[str, Any]) -> None:
    response = session().get(coin["iconUrl"], timeout=45)
    response.raise_for_status()
    (ICON_DIR / f"{coin['symbol'].lower()}.png").write_bytes(response.content)


def main() -> int:
    requested = [symbol for symbols in REQUESTED_GROUPS.values() for symbol in symbols]
    if len(requested) != 50 or len(set(requested)) != 50:
        raise RuntimeError("Requested taxonomy must contain exactly 50 unique symbols")

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(get_record, symbol): symbol for symbol in requested}
        records = {futures[future]: future.result() for future in concurrent.futures.as_completed(futures)}

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    coins: list[dict[str, Any]] = []
    for selection_rank, symbol in enumerate(requested, start=1):
        record = records[symbol]
        coins.append({
            "rank": record["rank"] or selection_rank,
            "selectionRank": selection_rank,
            "symbol": symbol,
            "sourceSymbol": record["sourceSymbol"],
            "nameFa": record["nameFa"],
            "nameEn": record["nameEn"],
            "slug": record["slug"],
            "marketCap": record["marketCap"],
            "marketCapCurrency": "USDT",
            "change24h": record["change24h"],
            "priceIrt": record["priceIrt"],
            "categories": CATEGORY_TAGS[symbol],
            "iconUrl": record["iconUrl"],
            "bit24Url": record["bit24Url"],
            "sourceType": record["sourceType"],
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    keep = {f"{symbol.lower()}.png" for symbol in requested}
    for old_icon in ICON_DIR.glob("*.png"):
        if old_icon.name not in keep:
            old_icon.unlink()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(download_icon, coins))

    snapshot = {
        "schemaVersion": 2,
        "generatedAt": generated_at,
        "source": [COINS_URL, OTC_API],
        "selection": "The exact 50-symbol v0.2 editorial taxonomy supplied by Bit24",
        "note": "Static snapshot. Values are contextual and not a live market feed.",
        "aliases": {"RNDR": "RENDER"},
        "categories": REQUESTED_GROUPS,
        "coins": coins,
    }
    (DATA_DIR / "coins.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(coins)} requested coins to {DATA_DIR / 'coins.json'}")
    print(f"Snapshot time UTC: {generated_at}")
    print("Symbols: " + ", ".join(coin["symbol"] for coin in coins))
    print("Source types: " + json.dumps({symbol: records[symbol]["sourceType"] for symbol in requested}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
