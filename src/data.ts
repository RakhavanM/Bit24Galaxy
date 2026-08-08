import type { Coin, CoinSnapshot } from './types'

export async function loadCoinSnapshot(): Promise<CoinSnapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/coins.json`)
  if (!response.ok) {
    throw new Error(`Snapshot request failed: ${response.status}`)
  }
  return (await response.json()) as CoinSnapshot
}

export function coinIconUrl(coin: Coin): string {
  return `${import.meta.env.BASE_URL}coin-icons/${coin.symbol.toLowerCase()}.png`
}

export function findCoin(coins: Coin[], symbol: string): Coin | undefined {
  return coins.find((coin) => coin.symbol.toLowerCase() === symbol.toLowerCase())
}
