[@inline] function getOraclePriceView(
    const oracleAddress   : address;
    const asset           : string)
                          : nat is
    unwrap(
      (Tezos.call_view("get_price", asset, oracleAddress)
                          : option(nat)),
      Errors.wrongOContract
    );

function getPrice(
  const tokenSet        : tokenSet;
  const s               : parserStorage)
                        : parserReturn is
  block {
    function oneTokenUpd(
      const operations  : list(operation);
      const tokenId     : nat)
                        : list(operation) is
      block {
        const strName : string = checkAssetName(tokenId, s.assetName);
        const oraclePrice : nat = getOraclePriceView(s.oracle, strName);
        const tezToUsdPrice : nat = getOraclePriceView(s.oracle, "XTZ");
        const usd : bool = (oraclePrice = tezToUsdPrice);
        const priceF : precisionValue = if (usd)
          then s.oraclePrecision * precision / oraclePrice // invert to Tezos per dollar
          else oraclePrice * precision / tezToUsdPrice;
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