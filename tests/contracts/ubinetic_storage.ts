import { MichelsonMap } from "@taquito/taquito";

export const tokenPrices = {
  CHFUSD: {
    last_epoch: 999999,
    price: 333333
  },
  EURUSD: {
    last_epoch: 999999,
    price: 1100000
  },
  XAUUSD: {
    last_epoch: 999999,
    price: 300000
  },
  CAKEUSDT: {
    last_epoch: 999999,
    price: 15000000
  },
  AAVEUSDT: {
    last_epoch: 999999,
    price: 100000000
  },
  UNIUSDT: {
    last_epoch: 999999,
    price: 50000000
  },
  BTCUSD: {
    last_epoch: 999999,
    price: 50000000000
  },
  XTZUSD: {
    last_epoch: 999999,
    price: 30000000
  },
  USDTUSD: {
    last_epoch: 999999,
    price: 999999
  }
}

export const tokenValidPrices = {
  CHFUSD: { valid_respondants: [], price: 333333 },
  EURUSD: { valid_respondants: [], price: 1100000 },
  XAUUSD: { valid_respondants: [], price: 300000 },
  CAKEUSDT: { valid_respondants: [], price: 15000000 },
  AAVEUSDT: { valid_respondants: [], price: 100000000 },
  UNIUSDT: { valid_respondants: [], price: 50000000 },
  BTCUSD: { valid_respondants: [], price: 50000000000 },
  XTZUSD: { valid_respondants: [], price: 30000000 },
  USDTUSD: { valid_respondants: [], price: 999999 }
}

export default {
  administrator: "tz3PmupcJFTWizddEahCtjtzDEhJf5TuuajK",
  prices: MichelsonMap.fromLiteral(tokenPrices),
  valid_prices: MichelsonMap.fromLiteral(tokenValidPrices),
  valid_script: "697066733a2f2f516d506e48734a384137596532485a3376716e556f475838513343777a45426d69706f4b3636354b6b5534623439",
  valid_sources: [],
  valid_respondants: [],
  response_threshold: 2,
  last_epoch: 0,
  valid_epoch: 999999,
  validity_window_in_epochs: 999999,
}
