#!/usr/bin/env python3
"""Build Bit24Galaxy v4's static 16-galaxy / 192-placement snapshot.

The supplied Bit24 category file is authoritative for selection and ordering.
Market-cap metadata prefers CoinMarketCap's public listing payload and falls
back to Bit24's public catalog when CMC has no usable market cap. No API key is
used or written to the repository.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/data/bit24_coins_by_category.json"
OUTPUT = ROOT / "public/data/coins.json"
ICON_DIR = ROOT / "public/coin-icons"
CMC_LISTING = "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing"
CMC_PAGE_BASE = "https://coinmarketcap.com/currencies/"
BIT24_CATALOG = "https://api.bit24.cash/api/v3/coins/"
BIT24_COIN_BASE = "https://bit24.cash/coins/"
USER_AGENT = "Bit24Galaxy/4.0 (+https://github.com/Rakhavanm/Bit24Galaxy)"

CATEGORY_IDS = {
    "توکن بازارهای جهانی": "global-markets",
    "شبکه‌های اصلی": "mainnets",
    "گیمینگ و متاورس": "gaming-metaverse",
    "هوش مصنوعی": "ai",
    "استیبل کوین": "stablecoins",
    "میم کوین": "memes",
    "لایه دوم": "layer2",
    "اوراکل": "oracles",
    "دیفای": "defi",
    "اینترنت اشیاء": "iot",
    "دپین": "depin",
    "ارز والت یا صرافی": "wallet-exchange",
    "پرایوسی کوین": "privacy",
    "سوشال فای": "socialfi",
    "ان اف تی": "nft",
    "توکن هواداری": "fan-tokens",
}

# CMC page fallback for assets below the listing endpoint's active-rank range.
CMC_SLUG_FALLBACK = {"GXE": "xeno-governance"}


def client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json,text/html"})
    return session


def number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).replace(",", "").replace("٬", "").replace("٫", ".")
    text = re.sub(r"[^0-9.\-]", "", text)
    try:
        return float(text) if text else None
    except ValueError:
        return None


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def cmc_candidate(bit24: dict[str, Any], candidates: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not candidates:
        return None
    bit_name = normalized(str(bit24.get("name", "")))

    def score(row: dict[str, Any]) -> tuple[float, float, float]:
        name = normalized(str(row.get("name", "")))
        exact = 1.0 if name == bit_name and bit_name else 0.0
        contains = 0.35 if bit_name and (bit_name in name or name in bit_name) else 0.0
        quote = (row.get("quotes") or [{}])[0]
        market_cap = number(quote.get("marketCap")) or 0.0
        return exact + contains + SequenceMatcher(None, bit_name, name).ratio(), market_cap, -(number(row.get("cmcRank")) or 999999)

    return max(candidates, key=score)


def parse_cmc_page(session: requests.Session, slug: str) -> dict[str, Any] | None:
    response = session.get(f"{CMC_PAGE_BASE}{slug}/", timeout=60)
    response.raise_for_status()
    text = response.text
    marker = '"statistics":{'
    start = text.find(marker)
    if start < 0:
        return None
    window = text[start : start + 3000]
    def field(name: str) -> float | None:
        match = re.search(rf'"{re.escape(name)}":(-?[0-9.e+]+)', window)
        return number(match.group(1)) if match else None
    detail = re.search(r'"id":(\d+),"name":"([^"]+)","symbol":"([^"]+)","slug":"([^"]+)"', text[start : start + 30000])
    return {
        "id": int(detail.group(1)) if detail else 0,
        "name": detail.group(2) if detail else slug,
        "symbol": detail.group(3) if detail else "",
        "slug": detail.group(4) if detail else slug,
        "cmcRank": field("rank") or 0,
        "quotes": [{
            "price": field("price"),
            "marketCap": field("marketCap") or 0,
            "fullyDiluttedMarketCap": field("fullyDilutedMarketCap") or 0,
            "percentChange24h": field("priceChangePercentage24h"),
        }],
        "_pageMarketCapFallback": field("fullyDilutedMarketCap") or 0,
        "_pageSource": f"{CMC_PAGE_BASE}{slug}/",
    }


def main() -> int:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))["categories"]
    selected = {name: symbols[:12] for name, symbols in source.items() if name != "بدون دسته‌بندی"}
    if len(selected) != 16 or any(not symbols or len(symbols) > 12 for symbols in selected.values()):
        raise RuntimeError("The supplied source must produce 16 non-empty categories with no more than 12 symbols each")
    placements = [(CATEGORY_IDS[name], symbol) for name, symbols in selected.items() for symbol in symbols]
    if len(placements) != 162:
        raise RuntimeError(f"Expected the supplied lists to produce 162 placements, got {len(placements)}")
    unique_symbols = list(dict.fromkeys(symbol for _, symbol in placements))

    session = client()
    bit_response = session.get(BIT24_CATALOG, timeout=120)
    bit_response.raise_for_status()
    bit_rows = bit_response.json()["data"]["list"]
    bit_by_symbol = {str(row.get("symbol", "")).upper(): row for row in bit_rows}

    cmc_response = session.get(CMC_LISTING, params={"start": 1, "limit": 10000, "sortBy": "market_cap", "sortType": "desc", "convert": "USD"}, timeout=180)
    cmc_response.raise_for_status()
    cmc_rows = cmc_response.json()["data"]["cryptoCurrencyList"]
    cmc_by_symbol: dict[str, list[dict[str, Any]]] = {}
    for row in cmc_rows:
        cmc_by_symbol.setdefault(str(row.get("symbol", "")).upper(), []).append(row)

    resolved: dict[str, dict[str, Any]] = {}
    provenance: dict[str, str] = {}
    for symbol in unique_symbols:
        bit = bit_by_symbol.get(symbol.upper())
        if not bit:
            raise RuntimeError(f"Bit24 catalog is missing requested symbol: {symbol}")
        cmc = cmc_candidate(bit, cmc_by_symbol.get(symbol.upper(), []))
        if (cmc is None or not number(((cmc.get("quotes") or [{}])[0]).get("marketCap"))) and symbol in CMC_SLUG_FALLBACK:
            cmc = parse_cmc_page(session, CMC_SLUG_FALLBACK[symbol])
        quote = (cmc.get("quotes") or [{}])[0] if cmc else {}
        cmc_market_cap = number(quote.get("marketCap")) if cmc else None
        bit_market_cap = number(bit.get("market_cap"))
        if cmc_market_cap and cmc_market_cap > 0:
            market_cap = cmc_market_cap
            market_cap_source = "coinmarketcap-listing"
        elif bit_market_cap and bit_market_cap > 0:
            market_cap = bit_market_cap
            market_cap_source = "bit24-catalog-fallback"
        elif cmc and number(cmc.get("_pageMarketCapFallback")):
            market_cap = number(cmc.get("_pageMarketCapFallback")) or 1
            market_cap_source = "coinmarketcap-fully-diluted-fallback"
        else:
            raise RuntimeError(f"No usable market cap for {symbol}; refusing to invent a value")

        bit_slug = str(bit.get("slug") or symbol).lower()
        resolved[symbol] = {
            "symbol": symbol,
            "sourceSymbol": symbol,
            "nameFa": bit.get("persian_name") or symbol,
            "nameEn": bit.get("name") or (cmc.get("name") if cmc else symbol),
            "slug": str(cmc.get("slug") if cmc else bit_slug),
            "bit24Slug": bit_slug,
            "marketCap": market_cap,
            "marketCapCurrency": "USD",
            "marketCapSource": market_cap_source,
            "change24h": number(quote.get("percentChange24h")) if cmc and quote.get("percentChange24h") is not None else number(bit.get("change")),
            "priceIrt": number(bit.get("irt_price")),
            "priceUsd": number(quote.get("price")) if cmc else number(bit.get("usd_price")),
            "rank": int(number(cmc.get("cmcRank")) or 0) if cmc else 0,
            "iconUrl": str(bit.get("icon") or ""),
            "bit24Url": f"{BIT24_COIN_BASE}{bit_slug}/",
        }
        provenance[symbol] = market_cap_source

    # Download into a staging directory. Existing assets are untouched until
    # every requested icon has downloaded successfully.
    staging = ROOT / ".v4-icons-staging"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    for symbol, record in resolved.items():
        icon_url = record["iconUrl"]
        if not icon_url:
            raise RuntimeError(f"Missing Bit24 icon URL for {symbol}")
        icon = session.get(icon_url, timeout=60)
        icon.raise_for_status()
        (staging / f"{symbol.lower()}.png").write_bytes(icon.content)

    ICON_DIR.mkdir(parents=True, exist_ok=True)
    for old_icon in ICON_DIR.glob("*.png"):
        old_icon.unlink()
    for staged_icon in staging.glob("*.png"):
        shutil.move(str(staged_icon), ICON_DIR / staged_icon.name)
    staging.rmdir()

    category_values = {CATEGORY_IDS[name]: symbols[:12] for name, symbols in selected.items()}
    coins: list[dict[str, Any]] = []
    for selection_rank, (category, symbol) in enumerate(placements, start=1):
        record = resolved[symbol]
        coins.append({
            "rank": record["rank"] or selection_rank,
            "selectionRank": selection_rank,
            "symbol": symbol,
            "sourceSymbol": record["sourceSymbol"],
            "nameFa": record["nameFa"],
            "nameEn": record["nameEn"],
            "slug": record["slug"],
            "bit24Slug": record["bit24Slug"],
            "marketCap": record["marketCap"],
            "marketCapCurrency": record["marketCapCurrency"],
            "marketCapSource": record["marketCapSource"],
            "change24h": record["change24h"],
            "priceIrt": record["priceIrt"],
            "priceUsd": record["priceUsd"],
            "categories": [category],
            "iconUrl": record["iconUrl"],
            "bit24Url": record["bit24Url"],
            "sourceType": "coinmarketcap-static-plus-bit24-catalog",
        })

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    snapshot = {
        "schemaVersion": 4,
        "generatedAt": generated_at,
        "source": [CMC_LISTING, *[f"{CMC_PAGE_BASE}{slug}/" for slug in CMC_SLUG_FALLBACK.values()], BIT24_CATALOG, str(SOURCE.relative_to(ROOT))],
        "selection": "Up to the first 12 symbols from each of the supplied 16 primary categories; uncategorized excluded.",
        "note": "Static v4 snapshot. CoinMarketCap market caps are preferred; Bit24 catalog or CMC fully-diluted fallback is recorded per row when needed. Values are not a live feed.",
        "categoryCount": 16,
        "placementCount": len(coins),
        "uniqueSymbolCount": len(unique_symbols),
        "categories": category_values,
        "marketCapProvenance": provenance,
        "coins": coins,
    }
    OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"categories": len(category_values), "placements": len(coins), "uniqueSymbols": len(unique_symbols), "icons": len(list(ICON_DIR.glob('*.png'))), "marketCapSources": {source: list(provenance.values()).count(source) for source in sorted(set(provenance.values()))}, "generatedAt": generated_at}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# added v4
