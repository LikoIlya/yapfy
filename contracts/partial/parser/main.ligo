type parserAction       is
| SetTimestampLimit       of nat
| UpdateOracle            of updateOracleParams
| UpdateAsset             of updateAssetParams
| GetPrice                of tokenSet
#if CALLBACK
| ReceivePrice            of receivePriceParams
#endif

[@inline] function main(
  const p               : parserAction;
  var s                 : parserStorage)
                        : parserReturn is
  block {
    non_tez_operation(Unit);
  } with case p of [
    // storage update only actions
    | SetTimestampLimit(limit)  -> (no_operations, setTimeLimit(limit, s))
    | UpdateOracle(params)      -> (no_operations, updateOracle(params, s))
    | UpdateAsset(params)       -> (no_operations, updateAsset(params, s))
    // storage update and operation create actions
    | GetPrice(params)          -> getPrice(params, s)
#if CALLBACK
    | ReceivePrice(params)      -> receivePrice(params, s)
#endif
  ]
