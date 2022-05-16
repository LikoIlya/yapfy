import { TezosToolkit } from "@taquito/taquito";
import config from "../config";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";
import router from "../build/router.json"
import fs from "fs";
import { confirmOperation } from "../utils/confirmation";
import { BytesValidationError } from "@taquito/michelson-encoder";
const harbingerBytes = fs.readFileSync("./build/bytes/harbinger.hex").toString();

module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  const contractAddress: TezosAddress = router.networks[network].router;
  const contract = await tezos.contract.at(contractAddress);
  let op = await contract.methodsObject.addParserType({
    parserType: "Harbinder",
    initFunction: harbingerBytes
  }).send();
  await confirmOperation(tezos, op.hash);
  const harbingerOracle = process.env.HARBINGER_ORACLE;
  const harbingerDeadline = 300;
  const harbingerDecimals = 1_000_000;
  op = await contract.methodsObject.connectOracle({
    oracle: harbingerOracle,
    oraclePrecision: harbingerDecimals,
    timestampLimit: harbingerDeadline,
    parserType: "Harbinder",
  }).send();
  await confirmOperation(tezos, op.hash);
  const parserAddress = await (await contract.storage() as any).oracleParser.get(harbingerOracle);
  console.log(`Parser for Harbinger address: ${parserAddress}`);
};
