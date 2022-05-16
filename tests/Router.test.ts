import BigNumber from "bignumber.js";
import fs from "fs";
import { Tezos, signerAlice, alice, signerBob } from "./utils/cli";
import { michelson as routerCode } from "../build/router.json";
import { confirmOperation } from "../utils/confirmation";
import storage from "./storage/router";
const yTokenCode = fs
  .readFileSync("./tests/contracts/yTokenTest.tz")
  .toString();
import yTokenStorage from "./contracts/yTest_storage";
const hOracleCode = fs
  .readFileSync("./tests/contracts/harbinger.tz")
  .toString();
import hOracleStorage, {
  tokenPrices as hTokenPrices,
} from "./contracts/harbinger_storage";
const uOracleCode = fs.readFileSync("./tests/contracts/ubinetic.tz").toString();
import uOracleStorage, {
  tokenPrices as uTokenPrices,
} from "./contracts/ubinetic_storage";
const cOracleCode = fs.readFileSync("./tests/contracts/ctez.tz").toString();
import cOracleStorage, {
  tokenPrices as cTokenPrices,
} from "./contracts/ctez_storage";
const wTokenPrices = { wTez: new BigNumber(1) };
import { Contract, MichelsonMap, TezosToolkit } from "@taquito/taquito";
import hTokens from "../storage/harbinger_tokens.json";
import uTokens from "../storage/ubinetic_tokens.json";
import cTokens from "../storage/ctez_tokens.json";
import wTokens from "../storage/wtez_tokens.json";
import { failCase, TezosAddress } from "../utils/helpers";
import { prepareCtezBytes } from "./utils/prepare_ctez";
const proxyPrecision = new BigNumber("1e36");

describe("Router", () => {
  let router: Contract;
  let responder: Contract;
  let hOracle: Contract;
  let uOracle: Contract;
  let cOracle: Contract;

  beforeAll(async () => {
    try {
      Tezos.setSignerProvider(signerAlice);
      const yTokenOp = await Tezos.contract.originate({
        code: yTokenCode,
        storage: yTokenStorage,
      });
      await confirmOperation(Tezos, yTokenOp.hash);
      responder = await Tezos.contract.at(yTokenOp.contractAddress);
      console.log("RESPONDER (yTokenReceiver):", responder.address);
      storage.yToken = yTokenOp.contractAddress;
      const routerOp = await Tezos.contract.originate({
        code: routerCode,
        storage: storage,
      });
      await confirmOperation(Tezos, routerOp.hash);
      router = await Tezos.contract.at(routerOp.contractAddress);
      console.log("ROUTER:", router.address);
    } catch (e) {
      console.error(e);
    }
  });

  describe("Harbinger example oracle (callback)", () => {
    const parserType = "Harbinger";
    beforeAll(async () => {
      const hOp = await Tezos.contract.originate({
        code: hOracleCode,
        storage: hOracleStorage,
      });
      await confirmOperation(Tezos, hOp.hash);
      hOracle = await Tezos.contract.at(hOp.contractAddress);
      console.log("hOracle:", hOracle.address);
    });
    it("Should fail when add bytes not by admin", async () => {
      const initFunction = fs
        .readFileSync("./build/bytes/harbinger.hex")
        .toString();
      const bobsTezos = new TezosToolkit(Tezos.rpc);
      bobsTezos.setSignerProvider(signerBob);
      const bobsRouter = await bobsTezos.contract.at(router.address);
      return await failCase(
        "bob",
        async () =>
          await bobsRouter.methodsObject
            .addParserType({
              initFunction,
              parserType,
            })
            .send(),
        "P_NOT_ADMIN"
      );
    });
    it("Add parser bytes to storage", async () => {
      const initFunction = fs
        .readFileSync("./build/bytes/harbinger.hex")
        .toString();
      let parserOp = await router.methodsObject
        .addParserType({
          initFunction,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (
        (await router.storage()) as typeof storage
      ).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    });

    it("Should fail when add existing type", async () =>
      await failCase(
        "alice",
        async () =>
          await router.methodsObject
            .addParserType({
              initFunction: "36",
              parserType,
            })
            .send(),
        "P_PARSER_TYPE_SET"
      ));

    it("Should fail when connect not by admin", async () => {
      const bobsTezos = new TezosToolkit(Tezos.rpc);
      bobsTezos.setSignerProvider(signerBob);
      const bobsRouter = await bobsTezos.contract.at(router.address);
      return await failCase(
        "bob",
        async () =>
          await bobsRouter.methodsObject
            .connectOracle({
              oracle: hOracle.address,
              oraclePrecision: 1_000_000,
              timestampLimit: 150000000,
              parserType,
            })
            .send(),
        "P_NOT_ADMIN"
      );
    });

    it("Connect oracle with proxy by parser", async () => {
      let parserOp = await router.methodsObject
        .connectOracle({
          oracle: hOracle.address,
          oraclePrecision: 1_000_000,
          timestampLimit: 150000000,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(hOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice");
      expect(parser.entrypoints.entrypoints).toHaveProperty(
        "setTimestampLimit"
      );
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset");
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle");
      const parserStorage = await ((await parser.storage()) as {
        router: TezosAddress;
        oracle: TezosAddress;
        oraclePrecision: BigNumber.Value;
        timestampLimit: BigNumber.Value;
      });
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(hOracle.address);
      expect(parserStorage.oraclePrecision.toString()).toEqual(
        new BigNumber(1_000_000).toString()
      );
      expect(parserStorage.timestampLimit.toString()).toEqual(
        new BigNumber(150000000).toString()
      );
    });
    it("Should fail when connect existing oracle", async () =>
      await failCase(
        "alice",
        async () =>
          await router.methodsObject
            .connectOracle({
              oracle: hOracle.address,
              oraclePrecision: 1_000_000,
              timestampLimit: 150000000,
              parserType,
            })
            .send(),
        "P_PARSER_ALREADY_SET"
      ));
    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(hOracle.address);
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
          })
        );
      }
      let op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("hOracle tokens mapped");
      for (var tokenId in hTokens) {
        const tokenParserAddress = await (
          (await router.storage()) as typeof storage
        ).tokenIdToParser.get(tokenId);
        expect(tokenParserAddress).toEqual(parserAddress);
      }
    });
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(Object.keys(hTokens)).send();
      await confirmOperation(Tezos, op.hash);
      const prices = (
        (await responder.storage()) as {
          priceF: MichelsonMap<string, BigNumber>;
        }
      ).priceF;
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(hOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (
        (await parser.storage()) as { oraclePrecision: BigNumber.Value }
      ).oraclePrecision;
      for (const tokenId in hTokens) {
        const exptedPrice =
          hTokens[tokenId].name == "XTZ-USD"
            ? new BigNumber(proxyPrecision)
                .multipliedBy(parserPrecision)
                .dividedBy(hTokenPrices[hTokens[tokenId].name])
                .dividedToIntegerBy(hTokens[tokenId].decimals)
            : new BigNumber(hTokenPrices[hTokens[tokenId].name])
                .multipliedBy(1e6)
                .dividedBy(hTokenPrices["XTZ-USD"])
                .multipliedBy(proxyPrecision)
                .div(parserPrecision)
                .dividedToIntegerBy(hTokens[tokenId].decimals);
        expect(prices.get(tokenId).toNumber()).toBeCloseTo(
          exptedPrice.toNumber(),
          -3
        );
      }
    });
  });

  describe("Ubinetic example oracle (view)", () => {
    const parserType = "Ubinetic";
    beforeAll(async () => {
      const uOp = await Tezos.contract.originate({
        code: uOracleCode,
        storage: uOracleStorage,
      });
      await confirmOperation(Tezos, uOp.hash);
      uOracle = await Tezos.contract.at(uOp.contractAddress);
      console.log("uOracle:", uOracle.address);
    });

    it("Add parser bytes to storage", async () => {
      const initFunction = fs
        .readFileSync("./build/bytes/ubinetic.hex")
        .toString();
      let parserOp = await router.methodsObject
        .addParserType({
          initFunction,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (
        (await router.storage()) as typeof storage
      ).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    });
    it("Connect oracle with proxy by parser", async () => {
      const parserOp = await router.methodsObject
        .connectOracle({
          oracle: uOracle.address,
          oraclePrecision: 1_000_000,
          timestampLimit: 15000,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(uOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice");
      expect(parser.entrypoints.entrypoints).toHaveProperty(
        "setTimestampLimit"
      );
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset");
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle");
      const parserStorage = await ((await parser.storage()) as {
        router: TezosAddress;
        oracle: TezosAddress;
        oraclePrecision: BigNumber.Value;
        timestampLimit: BigNumber.Value;
      });
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(uOracle.address);
      expect(parserStorage.oraclePrecision.toString()).toEqual(
        new BigNumber(1_000_000).toString()
      );
      expect(parserStorage.timestampLimit.toString()).toEqual(
        new BigNumber(15000).toString()
      );
    });
    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(uOracle.address);
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
          })
        );
      }
      const op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("uOracle tokens mapped");
      for (var tokenId in uTokens) {
        const tokenParserAddress = await (
          (await router.storage()) as typeof storage
        ).tokenIdToParser.get(tokenId);
        expect(parserAddress).toEqual(tokenParserAddress);
      }
    });
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(Object.keys(uTokens)).send();
      await confirmOperation(Tezos, op.hash);
      const prices = (
        (await responder.storage()) as {
          priceF: MichelsonMap<string, BigNumber>;
        }
      ).priceF;
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(uOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (
        (await parser.storage()) as { oraclePrecision: BigNumber.Value }
      ).oraclePrecision;
      for (const tokenId in uTokens) {
        const exptedPrice =
          uTokens[tokenId].name == "XTZ"
            ? new BigNumber(proxyPrecision)
                .multipliedBy(parserPrecision)
                .dividedBy(uTokenPrices[uTokens[tokenId].name])
                .dividedToIntegerBy(uTokens[tokenId].decimals)
            : new BigNumber(uTokenPrices[uTokens[tokenId].name])
                .multipliedBy(1e6)
                .dividedBy(uTokenPrices.XTZ)
                .multipliedBy(proxyPrecision)
                .div(parserPrecision)
                .dividedToIntegerBy(uTokens[tokenId].decimals);
        expect(prices.get(tokenId).toNumber()).toBeCloseTo(
          exptedPrice.toNumber(),
          -3
        );
      }
    });
  });

  describe("cTez example oracle (callback)", () => {
    const parserType = "cTezCB";
    beforeAll(async () => {
      prepareCtezBytes(uOracle.address);
      const cOp = await Tezos.contract.originate({
        code: cOracleCode,
        storage: cOracleStorage,
      });
      await confirmOperation(Tezos, cOp.hash);
      cOracle = await Tezos.contract.at(cOp.contractAddress);
      console.log("cOracle:", cOracle.address);
    });

    it("Add parser bytes to storage", async () => {
      const initFunction = fs.readFileSync("./build/bytes/ctez.hex").toString();
      let parserOp = await router.methodsObject
        .addParserType({
          initFunction,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (
        (await router.storage()) as typeof storage
      ).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    });
    it("Connect oracle with proxy by parser", async () => {
      let parserOp = await router.methodsObject
        .connectOracle({
          oracle: cOracle.address,
          oraclePrecision: 1,
          timestampLimit: 1,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(cOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice");
      expect(parser.entrypoints.entrypoints).toHaveProperty("receivePrice");
      expect(parser.entrypoints.entrypoints).toHaveProperty(
        "setTimestampLimit"
      );
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset");
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle");
      const parserStorage = await ((await parser.storage()) as {
        router: TezosAddress;
        oracle: TezosAddress;
        oraclePrecision: BigNumber.Value;
        timestampLimit: BigNumber.Value;
      });
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(cOracle.address);
      expect(parserStorage.oraclePrecision.toString()).toEqual(
        new BigNumber(1).toString()
      );
      expect(parserStorage.timestampLimit.toString()).toEqual(
        new BigNumber(1).toString()
      );
    });

    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(cOracle.address);
      let batch = await Tezos.contract.batch();
      for (var tokenId in cTokens) {
        const assetName = cTokens[tokenId].name;
        const decimals = cTokens[tokenId].decimals;
        batch = await batch.withContractCall(
          router.methodsObject.updateAsset({
            tokenId,
            assetName,
            decimals,
            oracle: cOracle.address,
          })
        );
      }
      let op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("cOracle tokens mapped");
      for (var tokenId in cTokens) {
        const tokenParserAddress = await (
          (await router.storage()) as typeof storage
        ).tokenIdToParser.get(tokenId);
        expect(parserAddress).toEqual(tokenParserAddress);
      }
    });

    it("should fail if not supported token tried to add (non-cTez)", async () =>
      await failCase(
        "alice",
        async () =>
          await router.methodsObject
            .updateAsset({
              tokenId: "9",
              assetName: "NotCTez",
              decimals: "6",
              oracle: cOracle.address,
            })
            .send(),
        "cTez_ONLY"
      ));
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(Object.keys(cTokens)).send();
      await confirmOperation(Tezos, op.hash);
      const prices = (
        (await responder.storage()) as {
          priceF: MichelsonMap<string, BigNumber>;
        }
      ).priceF;
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(cOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (
        (await parser.storage()) as { oraclePrecision: BigNumber.Value }
      ).oraclePrecision;
      for (const tokenId in cTokens) {
        const exptedPrice = new BigNumber(cTokenPrices[cTokens[tokenId].name])
          .multipliedBy(proxyPrecision)
          .div(parserPrecision)
          .dividedToIntegerBy(cTokens[tokenId].decimals);
        expect(prices.get(tokenId).toFormat(0)).toEqual(
          exptedPrice.toFormat(0)
        );
      }
    });
  });

  describe("wTez example oracle", () => {
    const parserType = "wTez";
    it("Add parser bytes to storage", async () => {
      const initFunction = fs.readFileSync("./build/bytes/wtez.hex").toString();
      let parserOp = await router.methodsObject
        .addParserType({
          initFunction,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserBytes = await (
        (await router.storage()) as typeof storage
      ).parserBytes.get(parserType);
      expect(parserBytes).toEqual(initFunction);
    });
    it("Connect oracle with proxy by parser", async () => {
      let parserOp = await router.methodsObject
        .connectOracle({
          oracle: "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg",
          oraclePrecision: 1,
          timestampLimit: 1,
          parserType,
        })
        .send();
      await confirmOperation(Tezos, parserOp.hash);
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg");
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      expect(parser.entrypoints.entrypoints).toHaveProperty("getPrice");
      expect(parser.entrypoints.entrypoints).toHaveProperty(
        "setTimestampLimit"
      );
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateAsset");
      expect(parser.entrypoints.entrypoints).toHaveProperty("updateOracle");
      const parserStorage = await ((await parser.storage()) as {
        router: TezosAddress;
        oracle: TezosAddress;
        oraclePrecision: BigNumber.Value;
        timestampLimit: BigNumber.Value;
      });
      expect(parserStorage.router).toEqual(router.address);
      expect(parserStorage.oracle).toEqual(
        "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg"
      );
      expect(parserStorage.oraclePrecision.toString()).toEqual(
        new BigNumber(1).toString()
      );
      expect(parserStorage.timestampLimit.toString()).toEqual(
        new BigNumber(1).toString()
      );
    });

    it("Add supported tokens to proxy", async () => {
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg");
      let batch = await Tezos.contract.batch();
      for (var tokenId in wTokens) {
        const assetName = wTokens[tokenId].name;
        const decimals = wTokens[tokenId].decimals;
        batch = await batch.withContractCall(
          router.methodsObject.updateAsset({
            tokenId,
            assetName,
            decimals,
            oracle: "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg",
          })
        );
      }
      let op = await batch.send();
      await confirmOperation(Tezos, op.hash);
      console.log("wTez token mapped");
      for (var tokenId in wTokens) {
        const tokenParserAddress = await (
          (await router.storage()) as typeof storage
        ).tokenIdToParser.get(tokenId);
        expect(parserAddress).toEqual(tokenParserAddress);
      }
    });

    it("should fail if not supported token tried to add (non-wTez)", async () =>
      await failCase(
        "alice",
        async () =>
          await router.methodsObject
            .updateAsset({
              tokenId: "10",
              assetName: "NotWTez",
              decimals: "6",
              oracle: "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg",
            })
            .send(),
        "wTez_ONLY"
      ));
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(Object.keys(wTokens)).send();
      await confirmOperation(Tezos, op.hash);
      const prices = (
        (await responder.storage()) as {
          priceF: MichelsonMap<string, BigNumber>;
        }
      ).priceF;
      const parserAddress = await (
        (await router.storage()) as typeof storage
      ).oracleParser.get(cOracle.address);
      expect(parserAddress).toMatch("KT1");
      const parser = await Tezos.contract.at(parserAddress);
      const parserPrecision = (
        (await parser.storage()) as { oraclePrecision: BigNumber.Value }
      ).oraclePrecision;
      for (const tokenId in wTokens) {
        const exptedPrice = new BigNumber(wTokenPrices[wTokens[tokenId].name])
          .multipliedBy(proxyPrecision)
          .div(parserPrecision)
          .dividedToIntegerBy(wTokens[tokenId].decimals);
        expect(prices.get(tokenId).toFormat(0)).toEqual(
          exptedPrice.toFormat(0)
        );
      }
    });
  });

  describe("All setted tokens", () => {
    const all_tokens = { ...hTokens, ...uTokens, ...cTokens, ...wTokens };
    const all_prices = {
      ...hTokenPrices,
      ...uTokenPrices,
      ...cTokenPrices,
      ...wTokenPrices,
    };

    it("Should fail when price response not from parser", async () =>
      await failCase(
        "bob",
        async () =>
          await router.methodsObject
            .receivePrice({
              tokenId: 0,
              priceF: 99999999,
            })
            .send(),
        "P_NOT_PARSER"
      ));
    it("Should fail when get wrong ID", async () =>
      await failCase(
        "bob",
        async () => await router.methods.getPrice([99]).send(),
        "P_UNKNOWN_TOKEN"
      ));
    it("Get tokens prices", async () => {
      const op = await router.methods.getPrice(Object.keys(all_tokens)).send();
      await confirmOperation(Tezos, op.hash);
      const prices = (
        (await responder.storage()) as {
          priceF: MichelsonMap<string, BigNumber>;
        }
      ).priceF;
      for (const tokenId in all_tokens) {
        const parserAddress = await (
          (await router.storage()) as typeof storage
        ).tokenIdToParser.get(tokenId);
        expect(parserAddress).toMatch("KT1");
        const parser = await Tezos.contract.at(parserAddress);
        const parserPrecision = (
          (await parser.storage()) as { oraclePrecision: BigNumber.Value }
        ).oraclePrecision;
        let exptedPrice = new BigNumber(0);
        console.log(all_tokens[tokenId].name);
        if (Object({ ...hTokens, ...uTokens }).hasOwnProperty(tokenId)) {
          if ((all_tokens[tokenId].name as string).startsWith("XTZ")) // if Call by XTZ price - USD token, invert price.
            exptedPrice = new BigNumber(parserPrecision)
              .dividedBy(all_prices[all_tokens[tokenId].name]);
          else {
            exptedPrice = new BigNumber(all_prices[all_tokens[tokenId].name]);
            if (Object(hTokens).hasOwnProperty(tokenId))
              exptedPrice = exptedPrice.dividedBy(all_prices["XTZ-USD"]);
            else
              exptedPrice = exptedPrice.dividedBy(all_prices["XTZ"]);
          }
        } else if (Object({ ...cTokens, ...wTokens }).hasOwnProperty(tokenId)) // oracles returns prices in XTZ
          exptedPrice = new BigNumber(all_prices[all_tokens[tokenId].name])
            .dividedBy(parserPrecision);
        exptedPrice = exptedPrice
          .multipliedBy(proxyPrecision)
          .dividedToIntegerBy(all_tokens[tokenId].decimals);
        console.log(
          all_tokens[tokenId].name,
          prices.get(tokenId).toNumber(),
          exptedPrice.toNumber()
        );
        expect(prices.get(tokenId).toNumber()).toBeCloseTo(
          exptedPrice.toNumber(),
          -3
        );
      }
    });
  });
});
