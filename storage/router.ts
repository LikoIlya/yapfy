import { MichelsonMap } from '@taquito/taquito';
import { TezosAddress } from '../utils/helpers';

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
  tokenIdToParser         : new MichelsonMap(),
  decimals                : new MichelsonMap(),
  oracleParser            : new MichelsonMap(),
  parserOracle            : new MichelsonMap(),
  parserBytes             : new MichelsonMap(),
  metadata
};
