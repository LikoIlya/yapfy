import { TezosToolkit } from "@taquito/taquito";
import config from "../config";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";
import router from "../build/router.json"
import fs from "fs";
import { confirmOperation } from "../utils/confirmation";
const ubineticBytes = fs.readFileSync("./build/bytes/ubinetic.hex").toString();

module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  const contractAddress: TezosAddress = router.networks[network].router;
  const contract = await tezos.contract.at(contractAddress);
  let op = await contract.methodsObject.addParserType({
    parserType: "Ubinetic",
    initFunction: ubineticBytes
  }).send();
  await confirmOperation(tezos, op.hash);
  const ubineticOracle = process.env.UBINETIC_ORACLE;
  const ubineticDeadline = 300;
  const ubineticDecimals = 1_000_000;
  op = await contract.methodsObject.connectOracle({
    oracle: ubineticOracle,
    oraclePrecision: ubineticDecimals,
    timestampLimit: ubineticDeadline,
    parserType: "Ubinetic",
  }).send();
  await confirmOperation(tezos, op.hash);
  const parserAddress = await (await contract.storage() as any).oracleParser.get(ubineticOracle);
  console.log(`Parser for Ubinetic address: ${parserAddress}`);
};
