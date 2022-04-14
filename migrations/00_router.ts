import storage from "../storage/router";
import { TezosToolkit } from "@taquito/taquito";
import config from "../config";
import { migrate } from "../scripts/commands/migrate/utils";
import { NetworkLiteral, TezosAddress } from "../utils/helpers";

module.exports = async (tezos: TezosToolkit, network: NetworkLiteral) => {
  storage.admin = await tezos.signer.publicKeyHash();
  const contractAddress: TezosAddress = await migrate(
    tezos,
    config.outputDirectory,
    "router",
    storage,
    network
  );
  console.log(`Router contract address: ${contractAddress}`);
};
