import { MichelsonMap } from "@taquito/michelson-encoder";
import { alice } from "../utils/cli";

export default {
  admin: alice.pkh,
  value: 42,
  priceF: new MichelsonMap(),
}
