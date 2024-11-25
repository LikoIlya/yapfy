[@inline] function getLPtzBTCPriceView(const oracleAddress  : address) : nat is
  unwrap(
    (Tezos.call_view("get_price", Unit, oracleAddress): option(nat)),
    Errors.wrongOContract
  )

function getGenericOraclePriceView(
    const asset           : string;
    const timestampLimit  : int)
                          : nat is
    block {
      const response: nat * timestamp = unwrap(
      (Tezos.call_view(
          "get_price_with_timestamp", 
          asset, 
          Constants.genericOracle
        ): option(nat * timestamp)),
      Errors.wrongOContract
    );
    checkTimestamp(response.1, timestampLimit);
  } with response.0

[@inline] function getXTZUSDPriceView(const timestampLimit  : int) : nat is
  getGenericOraclePriceView(Constants.baseQuoteName, timestampLimit);

[@inline] function getBTCUSDPriceView(const timestampLimit  : int) : nat is
  getGenericOraclePriceView(Constants.intermediateQuoteName, timestampLimit);

function updateAsset(
  const param           : updateAssetParams;
  var s                 : parserStorage)
                        : parserStorage is
  block {
    mustBeRouter(s.router);
    require(param.assetName = Constants.assetName, Errors.AssetCheck.sirsOnly);
    s.assetName[param.tokenId] := param.assetName;
    s.assetId[param.assetName] := param.tokenId;
  } with s

function getPrice(
  const tokenSet        : tokenSet;
  const s               : parserStorage)
                        : parserReturn is
  block {
    require(Set.cardinal(tokenSet) = 1n, Errors.AssetCheck.sirsOnly);
    function oneTokenUpd(
      const operations  : list(operation);
      const tokenId     : nat)
                        : list(operation) is
      block {
        require(Big_map.mem(tokenId, s.assetName), Errors.AssetCheck.sirsOnly);
        // We receive price as (1tzBTC to {price} SIRS) * 1e6
        const priceLP = getLPtzBTCPriceView(s.oracle);
        // So, to receive SIRS price to 1XTZ, we need to get prices for XTZ-USD and BTC-USD
        const tezToUsdPrice : nat = getXTZUSDPriceView(s.timestampLimit);
        const btcToUsdPrice : nat = getBTCUSDPriceView(s.timestampLimit);
        // sirsToBTC = oraclePrecision/price (SIRS/BTC)
        // tezToUSD = tezToUsdPrice/genericOraclePrecision (XTZ/USD)
        // btcToUSD = btcToUsdPrice/genericOraclePrecision (BTC/USD)
        // price = precision * ((sirsToBTC * btcToUSD) / tezToUSD)
        //                      (SIRS/BTC) * (BTC/USD) / (XTZ/USD) = (SIRS/USD) / (XTZ/USD) = SIRS/XTZ
        // price = precision * (oraclePrecision/price) * (btcToUsdPrice/genericOraclePrecision) / (tezToUsdPrice/genericOraclePrecision)
        //         precision * (oraclePrecision * btcToUsdPrice / price) / tezToUsdPrice
        //         precision * btcToUsdPrice * oraclePrecision / (tezToUsdPrice * price)
        const nominator : nat = precision * btcToUsdPrice * s.oraclePrecision;
        const denominator : nat = tezToUsdPrice * priceLP;
        const priceF: precisionValue = nominator / denominator;
        const tokenId : nat = checkAssetId(Constants.assetName, s.assetId);
        const receivePriceOp = Tezos.transaction(
          record [
            tokenId = tokenId;
            priceF = priceF;
          ],
          0mutez,
          getRouterPriceCallbackMethod(s.router)
        );
      } with receivePriceOp # operations;

      const operations = Set.fold(
        oneTokenUpd,
        tokenSet,
        (nil : list(operation))
      );
  } with (operations, s)