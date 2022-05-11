import { MichelsonMap } from '@taquito/taquito';
import { BytesString, TezosAddress } from '../utils/helpers';
import BigNumber from "bignumber.js";

const metadata = MichelsonMap.fromLiteral({
  "": Buffer.from("tezos-storage:router", "ascii").toString("hex"),
  router: Buffer.from(
    JSON.stringify({
      name: "Yupana PF Router",
      version: "v1.0.0",
      description: "Yupana protocol Price Feed main router.",
      authors: ["Madfish.Solutions <https://www.madfish.solutions>"],
      homepage: "https://yupana.com",
      interfaces: ["TZIP-16"],
    }),
    "ascii"
  ).toString("hex"),
});

export default {
  admin                   : null as TezosAddress,
  admin_candidate         : null as TezosAddress,
  yToken                  : process.env.YTOKEN_ADDRESS,
  tokenIdToParser         : new MichelsonMap() as MichelsonMap<BigNumber.Value, TezosAddress>,
  decimals                : new MichelsonMap() as MichelsonMap<BigNumber.Value, BigNumber.Value>,
  oracleParser            : new MichelsonMap() as MichelsonMap<TezosAddress, TezosAddress>,
  parserOracle            : new MichelsonMap() as MichelsonMap<TezosAddress, TezosAddress>,
  parserBytes             : new MichelsonMap() as MichelsonMap<string, BytesString>,
  metadata
};
