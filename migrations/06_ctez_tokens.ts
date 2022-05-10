import { TezosToolkit } from "@taquito/taquito";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";
import router from "../build/router.json"
import { confirmOperation } from "../utils/confirmation";
import tokens from "../storage/ctez_tokens.json";


module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  const contractAddress: TezosAddress = router.networks[network].router;
  const contract = await tezos.contract.at(contractAddress);
  let batch = await tezos.contract.batch();
  for (var tokenId in tokens) {
    const assetName = tokens[tokenId].name;
    const decimals = tokens[tokenId].decimals;
    batch = await batch.withContractCall(
      contract.methodsObject.updateAsset({
        tokenId,
        assetName,
        decimals,
        oracle: process.env.CTEZ_ORACLE,
      }));
  }
  const op = await batch.send();
  await confirmOperation(tezos, op.hash);
  console.log(`Tokens for cTez set.`);
};
