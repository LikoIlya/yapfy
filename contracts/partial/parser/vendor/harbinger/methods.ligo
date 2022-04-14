[@inline] function getNormalizerContract(
  const oracleAddress   : address)
                        : contract(getType) is
  unwrap(
    (Tezos.get_entrypoint_opt("%get", oracleAddress)
                        : option(contract(getType))),
    Errors.wrongOContract
  )


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
        const param : contract(receivePriceParams) = Tezos.self("%receivePrice");

        const receivePriceOp = Tezos.transaction(
          Get(strName, param),
          0mutez,
          getNormalizerContract(s.oracle)
        );
      } with receivePriceOp # operations;

      const operations = Set.fold(
        oneTokenUpd,
        tokenSet,
        (nil : list(operation))
      );
  } with (operations, s)

function receivePrice(
  const param           : receivePriceParams;
  var s                 : parserStorage)
                        : parserReturn is
  block {
    mustBeOracle(s.oracle);
    checkTimestamp(param.1.0, s.timestampLimit);
    const assetName : string = param.0;
    const oraclePrice = param.1.1;
    const priceF : precisionValue = oraclePrice * precision / s.oraclePrecision;
    const tokenId : nat = checkAssetId(assetName, s.assetId);
    var operations : list(operation) := list[
      Tezos.transaction(
        record [
          tokenId = tokenId;
          priceF = priceF;
        ],
        0mutez,
        getRouterPriceCallbackMethod(s.router)
      )
    ];
  } with (operations, s)