import { MichelsonMap, UnitValue } from "@taquito/taquito";

export const administrators = {
  tz3PmupcJFTWizddEahCtjtzDEhJf5TuuajK: 1
};

export const certificate_updaters = {
  tz3PmupcJFTWizddEahCtjtzDEhJf5TuuajK: UnitValue,
};

export const tokenPrices = {
  BTCUSDT: {
    price: 50000000000,
    last_update_timestamp: 999999,
  },
  XTZUSDT: {
    price: 30000000,
    last_update_timestamp: 999999,
  },
  USDTUSD: {
    price: 999999,
    last_update_timestamp: 999999,
  },
  BTCUSD: {
    price: 50000000000,
    last_update_timestamp: 333333,
  },
  XAUUSD: {
    price: 300000,
    last_update_timestamp: 333333,
  },
};

export default {
  administrators: MichelsonMap.fromLiteral(administrators),
  certificate_updaters: MichelsonMap.fromLiteral(certificate_updaters),
  metadata: MichelsonMap.fromLiteral({}),
  price_validity_duration: 999999,
  prices: MichelsonMap.fromLiteral(tokenPrices),
  response_threshold: 3,
  valid_certificates: [],
  valid_certificates_threshold: 3,
  valid_script: Buffer.from(
    "ipfs://QmeFyCUgoYKseWW6YZUvjcKpLjbNL2dNAeMoX1Bn2xW97L",
    "ascii"
  ).toString("hex"),
  valid_sources: []
};
