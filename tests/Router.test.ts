import { Tezos, signerAlice, alice } from "./utils/cli";
import fs from "fs"
import { michelson as routerCode } from "../build/router.json"
import { confirmOperation } from "../utils/confirmation";
import storage from "./storage/router"
const yTokenCode = fs.readFileSync("./tests/contracts/yTokenTest.tz").toString()
import yTokenStorage from "./contracts/yTest_storage"
const hOracleCode = fs.readFileSync("./tests/contracts/harbinger.tz").toString()
import hOracleStorage, { tokenPrices as hTokenPrices } from "./contracts/harbinger_storage"
const uOracleCode = fs.readFileSync("./tests/contracts/ubinetic.tz").toString()
import uOracleStorage, { tokenPrices as uTokenPrices } from "./contracts/ubinetic_storage"
import { Contract, MichelsonMap } from "@taquito/taquito";
import hTokens from "../storage/harbinger_tokens.json";
import uTokens from "../storage/ubinetic_tokens.json";
import BigNumber from 'bignumber.js';
import { TezosAddress } from "../utils/helpers";
const proxyPrecision = new BigNumber("1e36");

describe("Router", () => {
  let router: Contract;
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
      console.log("RESPONDER (yTokenReceiver):", responder.address)
      storage.yToken = yTokenOp.contractAddress;
      const routerOp = await Tezos.contract.originate({
        code: routerCode,
        storage: storage,
      });
      await confirmOperation(Tezos, routerOp.hash)
      router = await Tezos.contract.at(routerOp.contractAddress);
      console.log("ROUTER:", router.address)
    } catch (e) {
      console.error(e);
    }
  });

  describe("Habringer example oracle (callback)", () => {
    const parserType = "HarbinderCB";
    let hOracle: Contract;
    beforeAll(async () => {
      const hOp = await Tezos.contract.originate({
        code: hOracleCode,
        storage: hOracleStorage,
      });
      await confirmOperation(Tezos, hOp.hash);
      hOracle = await Tezos.contract.at(hOp.contractAddress)
      console.log("hOracle:", hOracle.address)
    })

    it("Add parser bytes to storage", async () => {
      const initFunction = fs.readFileSync("./build/bytes/harbinger.hex").toString()
      let parserOp = await router.methodsObject.addParserType({
        initFunction,
        parserType,
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (await router.storage() as typeof storage).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    })
    it("Connect oracle with proxy by parser", async () => {
      let parserOp = await router.methodsObject.connectOracle({
        oracle: hOracle.address,
        oraclePrecision: 1_000_000,
        timestampLimit: 150000000,
        parserType,
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(hOracle.address);
      expect(parserAddress).toMatch("KT1")
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice")
      expect(parser.entrypoints.entrypoints).toHaveProperty("receivePrice")
      expect(parser.entrypoints.entrypoints).toHaveProperty("setTimestampLimit")
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset")
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle")
      const parserStorage = await (await parser.storage() as {
        router: TezosAddress,
        oracle: TezosAddress,
        oraclePrecision: BigNumber.Value,
        timestampLimit: BigNumber.Value
      })
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(hOracle.address);
      expect(parserStorage.oraclePrecision.toString()).toEqual(new BigNumber(1_000_000).toString());
      expect(parserStorage.timestampLimit.toString()).toEqual(new BigNumber(150000000).toString());
    })
    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(hOracle.address);
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
      for (var tokenId in hTokens) {
        const tokenParserAddress = await (await router.storage() as typeof storage).tokenIdToParser.get(tokenId);
        expect(parserAddress).toEqual(tokenParserAddress);
      }
    })
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(
        Object.keys(hTokens)
      ).send();
      await confirmOperation(Tezos, op.hash)
      const prices = (await responder.storage() as { priceF: MichelsonMap<string, BigNumber> }).priceF
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(hOracle.address);
      expect(parserAddress).toMatch("KT1")
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (await parser.storage() as {oraclePrecision: BigNumber.Value}).oraclePrecision
      for (const tokenId in hTokens) {
        const exptedPrice = new BigNumber(hTokenPrices[hTokens[tokenId].name]).multipliedBy(proxyPrecision).div(parserPrecision).dividedToIntegerBy(hTokens[tokenId].decimals);
        expect(exptedPrice.toString()).toEqual(prices.get(tokenId).toString())
      }
    });
  });


  describe("Ubinetic example oracle (view)", () => {
    const parserType = "UbineticV";
    let uOracle: Contract;
    beforeAll(async () => {
      const uOp = await Tezos.contract.originate({
        code: uOracleCode,
        storage: uOracleStorage,
      });
      await confirmOperation(Tezos, uOp.hash);
      uOracle = await Tezos.contract.at(uOp.contractAddress)
      console.log("uOracle:", uOracle.address)
    })

    it("Add parser bytes to storage", async () => {
      const initFunction = fs.readFileSync("./build/bytes/ubinetic.hex").toString()
      let parserOp = await router.methodsObject.addParserType({
        initFunction,
        parserType,
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (await router.storage() as typeof storage).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    })
    it("Connect oracle with proxy by parser", async () => {
      const parserOp = await router.methodsObject.connectOracle({
        oracle: uOracle.address,
        oraclePrecision: 1_000_000,
        timestampLimit: 15000,
        parserType,
      }).send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(uOracle.address);
      expect(parserAddress).toMatch("KT1")
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice")
      expect(parser.entrypoints.entrypoints).toHaveProperty("setTimestampLimit")
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset")
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle")
      const parserStorage = await (await parser.storage() as {
        router: TezosAddress,
        oracle: TezosAddress,
        oraclePrecision: BigNumber.Value,
        timestampLimit: BigNumber.Value
      })
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(uOracle.address);
      expect(parserStorage.oraclePrecision.toString()).toEqual(new BigNumber(1_000_000).toString());
      expect(parserStorage.timestampLimit.toString()).toEqual(new BigNumber(15000).toString());
    })
    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(uOracle.address);
      let batch = await Tezos.contract.batch();
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
      const op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("uOracle tokens mapped")
      for (var tokenId in uTokens) {
        const tokenParserAddress = await (await router.storage() as typeof storage).tokenIdToParser.get(tokenId);
        expect(parserAddress).toEqual(tokenParserAddress);
      }
    })
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(
        Object.keys(uTokens)
      ).send();
      await confirmOperation(Tezos, op.hash)
      const prices = (await responder.storage() as { priceF: MichelsonMap<string, BigNumber> }).priceF
      const parserAddress = await (await router.storage() as typeof storage).oracleParser.get(uOracle.address);
      expect(parserAddress).toMatch("KT1")
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (await parser.storage() as {oraclePrecision: BigNumber.Value}).oraclePrecision
      for (const tokenId in uTokens) {
        const exptedPrice = new BigNumber(uTokenPrices[uTokens[tokenId].name]).multipliedBy(proxyPrecision).div(parserPrecision).dividedToIntegerBy(uTokens[tokenId].decimals);
        expect(exptedPrice.toString()).toEqual(prices.get(tokenId).toString())
      }
    });
  });

  describe("All: Example", () => {
    const all_tokens = { ...hTokens, ...uTokens };
    const all_prices = { ...hTokenPrices, ...uTokenPrices };
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(
        Object.keys(all_tokens)
      ).send();
      await confirmOperation(Tezos, op.hash)
      const prices = (await responder.storage() as { priceF: MichelsonMap<string, BigNumber> }).priceF
      for (const tokenId in hTokens) {
        const parserAddress = await (await router.storage() as typeof storage).tokenIdToParser.get(tokenId);
        expect(parserAddress).toMatch("KT1")
        const parser = await Tezos.contract.at(parserAddress);
        const parserPrecision = (await parser.storage() as { oraclePrecision: BigNumber.Value }).oraclePrecision
        const exptedPrice = new BigNumber(all_prices[hTokens[tokenId].name]).multipliedBy(proxyPrecision).div(parserPrecision).dividedToIntegerBy(hTokens[tokenId].decimals);
        expect(exptedPrice.toString()).toEqual(prices.get(tokenId).toString())
        console.log(exptedPrice.toString(), prices.get(tokenId).toString());
      }
    });
  });
});
