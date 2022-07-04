[@inline] function getNormalizerPrice(
  const oracleAddress   : address;
  const asset           : string;
  const timestampLimit  : int)
                        : nat is
  block {
    const response: timestamp * nat = unwrap(
      (Tezos.call_view("getPrice", asset, oracleAddress)
                          : option(timestamp * nat)),
      Errors.wrongOContract
    );
    checkTimestamp(response.0, timestampLimit);
  } with response.1;

function getPrice(
  const tokenSet        : tokenSet;
  const s               : parserStorage)
                        : parserReturn is
  block {
     const tezToUsdPrice = getNormalizerPrice(s.oracle, "XTZ-USD", s.timestampLimit);
    function oneTokenUpd(
      const operations  : list(operation);
      const tokenId     : nat)
                        : list(operation) is
      block {
        const strName : string = checkAssetName(tokenId, s.assetName);
        const oraclePrice = getNormalizerPrice(s.oracle, strName, s.timestampLimit);
        const usd : bool = (strName = "XTZ-USD"); // if price is XTZ/USD
        const priceF : precisionValue = if (usd)  // then this is the USD-peg and we should
          then s.oraclePrecision * precision / oraclePrice // invert to USD/XTZ (1/priceF)
          else oraclePrice * precision / tezToUsdPrice; // else divide by XTZ/USD price to send XTZ-related price
        const tokenId : nat = checkAssetId(strName, s.assetId);
        var op : operation := Tezos.transaction(
          record [
            tokenId = tokenId;
            priceF = priceF;
          ],
          0mutez,
          getRouterPriceCallbackMethod(s.router)
        );
      } with op # operations;
    const operations = Set.fold(
      oneTokenUpd,
      tokenSet,
      (nil : list(operation))
    )
  } with (operations, s)