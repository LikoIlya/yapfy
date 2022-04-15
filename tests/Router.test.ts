import { Tezos, signerAlice, alice } from "./utils/cli";
import fs from "fs"
import { michelson as routerCode } from "../build/router.json"
import { confirmOperation } from "../utils/confirmation";
import storage from "./storage/router"
const yTokenCode = fs.readFileSync("./tests/contracts/yTokenTest.tz").toString()
import yTokenStorage from "./contracts/yTest_storage"
const hOracleCode = fs.readFileSync("./tests/contracts/harbinger.tz").toString()
import hOracleStorage from "./contracts/harbinger_storage"
const uOracleCode = fs.readFileSync("./tests/contracts/ubinetic.tz").toString()
import uOracleStorage from "./contracts/ubinetic_storage"
import { Contract, MichelsonMap } from "@taquito/taquito";
import hTokens from "../storage/harbinger_tokens.json";
import uTokens from "../storage/ubinetic_tokens.json";
import BigNumber from 'bignumber.js';

describe("Router", () => {
  let router: Contract;
  let hOracle: Contract;
  let uOracle: Contract;
  let responder: Contract;

  beforeAll(async () => {
    try {
      Tezos.setSignerProvider(signerAlice);
      const yTokenOp = await Tezos.contract.originate({
        code: yTokenCode,
        storage: yTokenStorage,
      });
      await confirmOperation(Tezos, yTokenOp.hash);
      responder = await Tezos.contract.at(yTokenOp.contractAddress)
      console.log("RESPONDER:", responder.address)
      storage.yToken = yTokenOp.contractAddress;
      const routerOp = await Tezos.contract.originate({
        code: routerCode,
        storage: storage,
      });
      await confirmOperation(Tezos, routerOp.hash)
      router = await Tezos.contract.at(routerOp.contractAddress);
      console.log("ROUTER:", router.address)

      const hOp = await Tezos.contract.originate({
        code: hOracleCode,
        storage: hOracleStorage,
      });
      await confirmOperation(Tezos, hOp.hash);
      hOracle = await Tezos.contract.at(hOp.contractAddress)
      console.log("hOracle:", hOracle.address)

      let parserOp = await router.methodsObject.connectOracle({
        oracle: hOracle.address,
        oraclePrecision: 1_000_000,
        timestampLimit: 150000000,
        parserType: "HarbinderCB",
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      console.log("hOracle connected")
      let batch = await Tezos.contract.batch();
      for (var tokenId in hTokens) {
        const assetName = hTokens[tokenId].name;
        const decimals = hTokens[tokenId].decimals;
        batch = await batch.withContractCall(
          router.methodsObject.updateAsset({
            tokenId,
            assetName,
            decimals,
            oracle: hOracle.address,
          }));
      }
      let op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("hOracle tokens mapped")
      const uOp = await Tezos.contract.originate({
        code: uOracleCode,
        storage: uOracleStorage,
      });
      await confirmOperation(Tezos, uOp.hash);
      uOracle = await Tezos.contract.at(uOp.contractAddress)
      console.log("uOracle:", uOracle.address)
      parserOp = await router.methodsObject.connectOracle({
        oracle: uOracle.address,
        oraclePrecision: 1_000_000,
        timestampLimit: 15000,
        parserType: "UbineticV",
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      console.log("uOracle connected")
      batch = await Tezos.contract.batch();
      for (var tokenId in uTokens) {
        const assetName = uTokens[tokenId].name;
        const decimals = uTokens[tokenId].decimals;
        batch = await batch.withContractCall(
          router.methodsObject.updateAsset({
            tokenId,
            assetName,
            decimals,
            oracle: uOracle.address,
          }));
      }
      op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("uOracle tokens mapped")

    } catch (e) {
      console.log(e);
    }
  });

  describe("Add: Example", () => {
    const all_tokens = { ...hTokens, ...uTokens };
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(
        Object.keys(all_tokens)
      ).send();
      await confirmOperation(Tezos, op.hash)
      const prices = (await responder.storage() as { priceF: MichelsonMap<string, BigNumber> }).priceF
      prices.forEach((price, tokenId) => console.log(all_tokens[tokenId].name, price.toString()))
    });
  });
});
