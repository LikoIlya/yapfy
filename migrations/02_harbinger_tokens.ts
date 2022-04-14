import { TezosToolkit } from "@taquito/taquito";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";
import router from "../build/router.json"
import { confirmOperation } from "../utils/confirmation";


module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  const contractAddress: TezosAddress = router.networks[network].router;
  const contract = await tezos.contract.at(contractAddress);
  let batch = await tezos.contract.batch();
  batch = await batch.withContractCall(
    contract.methodsObject.updateAsset({
      tokenId: 0,
      assetName: "XTZ-USD",
      decimals: 1_000_000,
      oracle: process.env.HARBINGER_ORACLE,
    }));
  batch = await batch.withContractCall(
      contract.methodsObject.updateAsset({
        tokenId: 1,
        assetName: "BTC-USD",
        decimals: 100_000_000,
        oracle: process.env.HARBINGER_ORACLE,
      }));
  const op = await batch.send();
  await confirmOperation(tezos, op.hash);
  console.log(`Tokens for Harbinger set.`);
};
