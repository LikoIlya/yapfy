import { MichelsonMap } from "@taquito/taquito";

export default {
  administrator: "tz3PmupcJFTWizddEahCtjtzDEhJf5TuuajK",
  last_epoch: 9999999,
  prices:  MichelsonMap.fromLiteral({
    DEFI: 1000000,
    BTC: 50000000000,
    XTZ: 30000000
  }),
  response_threshold: 2,
  valid_epoch: 999999,
  valid_respondants: [],
  valid_script: "697066733a2f2f516d6150327862337a76534368426765523647625132566a4d6b61637278466f52436470444264485a596d786a76",
  valid_sources: [],
  valid_btc_price: 1000000,
  valid_defi_price: 50000000000,
  valid_xtz_price: 30000000,
  validity_window_in_epochs: 999999,
}
