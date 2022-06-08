import { MichelsonMap } from '@taquito/taquito';
import { BytesString, TezosAddress } from '../utils/helpers';
import BigNumber from "bignumber.js";

const metadata = MichelsonMap.fromLiteral({
  "": Buffer.from("ipfs://QmZTCZ4phYTLfCGs2cvCsVvcSEqpvGFbtze3qAVzbW4M73", "ascii").toString("hex"),
  // router: Buffer.from(
  //   JSON.stringify({
  //     name: "Yupana PF Router",
  //     version: "v0.1.1-tez",
  //     description: "Yupana protocol Price Feed main router.",
  //     authors: ["Madfish.Solutions <https://www.madfish.solutions>"],
  //     "source": {
  //       "tools": ["Ligo", "Flextesa"],
  //       "location": "https://github.com/madfish-solutions/yapfy/blob/v0.1.1-tez/contracts/main/router.ligo"
  //     },
  //     homepage: "https://yupana.finance",
  //     interfaces: ["TZIP-016"],
  //   }),
  //   "ascii"
  // ).toString("hex"),
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
