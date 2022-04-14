function checkTimestamp(
  const oracleTimestamp : timestamp;
  const limit           : int)
                        : unit is
  require(oracleTimestamp >= Tezos.now - limit, Errors.timestampLimit);

[@inline] function mustBeRouter(
  const router          : address)
                        : unit is
  require(Tezos.sender = router, Errors.notRouter)

[@inline] function mustBeOracle(
  const oracle          : address)
                        : unit is
  require(Tezos.sender = oracle, Errors.notOracle)

[@inline] function getRouterPriceCallbackMethod(
  const router          : address)
                        : contract(parserResponse) is
  unwrap(
    (Tezos.get_entrypoint_opt("%receivePrice", router)
                        : option(contract(parserResponse))),
    Errors.notRouter
  )

[@inline] function checkAssetName(
  const tokenId         : tokenId;
  const assetName       : big_map(tokenId, assetString))
                        : string is
  unwrap(assetName[tokenId], Errors.AssetCheck.assetString)

[@inline] function checkAssetId(
  const assetName       : assetString;
  const assetId         : big_map(assetString, tokenId))
                        : tokenId is
  unwrap(assetId[assetName], Errors.AssetCheck.tokenId)