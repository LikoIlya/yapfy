import { TezosToolkit } from "@taquito/taquito";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";
import router from "../build/router.json"
import fs from "fs";
import { confirmOperation } from "../utils/confirmation";
import { prepareCtezBytes } from "../tests/utils/prepare_ctez";

module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  prepareCtezBytes(process.env.UBINETIC_ORACLE);
  const cTezBytes = fs.readFileSync("./build/bytes/ctez.hex").toString();
  const contractAddress: TezosAddress = router.networks[network].router;
  const contract = await tezos.contract.at(contractAddress);
  let op = await contract.methodsObject.addParserType({
    parserType: "cTezCB",
    initFunction: cTezBytes
  }).send();
  await confirmOperation(tezos, op.hash);
  const cTezOracle = process.env.CTEZ_ORACLE;
  const cTezDeadline = 1;
  const cTezDecimals = 48;
  op = await contract.methodsObject.connectOracle({
    oracle: cTezOracle,
    oraclePrecision: cTezDecimals,
    timestampLimit: cTezDeadline,
    parserType: "cTezCB",
  }).send();
  await confirmOperation(tezos, op.hash);
  const parserAddress = await (await contract.storage() as any).oracleParser.get(cTezOracle);
  console.log(`Parser for cTez address: ${parserAddress}`);
};
