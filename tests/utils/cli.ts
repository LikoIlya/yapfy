import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";

import env from "../../config";

const { alice, bob } = env.networks.sandbox.accounts;
const networkConfig = env.networks.sandbox;

const rpc = networkConfig.host + ":" + networkConfig.port;
const Tezos = new TezosToolkit(rpc);

const signerAlice = new InMemorySigner(networkConfig.defaultSignerSK);
const signerBob = new InMemorySigner(bob.sk);

Tezos.setSignerProvider(signerAlice);


export { Tezos, signerAlice, signerBob, alice, bob };
