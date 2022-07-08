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
    const no_operations: list(operation) = nil;
    s := case p of [
      | SetTimestampLimit(limit)  -> setTimeLimit(limit, s)
      | UpdateOracle(params)      -> updateOracle(params, s)
      | UpdateAsset(params)       -> updateAsset(params, s)
      | _ -> s
    ]
  } with case p of [
    | GetPrice(params)          -> getPrice(params, s)
#if CALLBACK
    | ReceivePrice(params)      -> receivePrice(params, s)
#endif
    | _ -> (no_operations, s)
  ]
