[@inline] function getParser(
  const parser          : address)
                        : contract(tokenSet) is
  unwrap(
    (Tezos.get_entrypoint_opt("%getPrice", parser): option(contract(tokenSet))),
    Errors.notParserGet
  );

[@inline] function getParserTimestampSetter(
  const parser          : address)
                        : contract(nat) is
  unwrap(
    (Tezos.get_entrypoint_opt("%setTimestampLimit", parser): option(contract(nat))),
    Errors.notParserTimestampSetter
  );

[@inline] function getParserAssetSetter(
  const parser          : address)
                        : contract(updateAssetParams) is
  unwrap(
    (Tezos.get_entrypoint_opt("%updateAsset", parser): option(contract(updateAssetParams))),
    Errors.notParserAssetSetter
  );

[@inline] function getParserOracleSetter(
  const parser          : address)
                        : contract(updateOracleParams) is
  unwrap(
    (Tezos.get_entrypoint_opt("%updateOracle", parser): option(contract(updateOracleParams))),
    Errors.notParserOracleSetter
  );



[@inline] function getYTokenPriceCallbackMethod(
  const yToken          : address)
                        : contract(yAssetParams) is
  unwrap(
    (Tezos.get_entrypoint_opt("%priceCallback", yToken)
                        : option(contract(yAssetParams))),
    Errors.wrongYContract
  )

[@inline] function getDecimal(
  const assetId         : tokenId;
  const tokensDecimals  : big_map(tokenId, nat))
                        : nat is
  unwrap(tokensDecimals[assetId], Errors.AssetCheck.decimals)

function deployFromBytes(
  const contractBytes     : bytes;
  const storage           : parserStorage)
                          : (operation * address) is
  block {
    const deployer : deploy_func_t = unwrap(
      (Bytes.unpack(contractBytes): option(deploy_func_t)),
      Errors.cantUnpackBytes
    );
  } with deployer(
    (None : option (key_hash)),
    0mutez,
    storage
  )


