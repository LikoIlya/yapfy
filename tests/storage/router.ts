import { MichelsonMap } from '@taquito/taquito';
import { TezosAddress, BytesString } from '../../utils/helpers';
import fs from "fs";
import { alice } from "../utils/cli";
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

const parserMap = new MichelsonMap<string, BytesString>();
// const hab = fs.readFileSync("./build/bytes/harbinger.hex").toString()
// parserMap.set("HarbinderCB", hab);
// const ubi = fs.readFileSync("./build/bytes/ubinetic.hex").toString()
// parserMap.set("UbineticV", ubi);

export default {
  admin                   : alice.pkh as TezosAddress,
  admin_candidate         : null as TezosAddress,
  yToken                  : null as TezosAddress,
  tokenIdToParser         : new MichelsonMap() as MichelsonMap<BigNumber.Value, TezosAddress>,
  decimals                : new MichelsonMap() as MichelsonMap<BigNumber.Value, BigNumber.Value>,
  oracleParser            : new MichelsonMap() as MichelsonMap<TezosAddress, TezosAddress>,
  parserOracle            : new MichelsonMap() as MichelsonMap<TezosAddress, TezosAddress>,
  parserBytes             : parserMap,
  metadata
};
