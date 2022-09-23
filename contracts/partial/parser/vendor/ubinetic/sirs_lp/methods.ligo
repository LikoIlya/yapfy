[@inline] function getLPTargetContract(
  const oracleAddress   : address)
                        : contract(contract(nat)) is
  unwrap(
    (Tezos.get_entrypoint_opt("%get_price", oracleAddress)
                        : option(contract(contract(nat)))),
    Errors.wrongOContract
  )

[@inline] function getXTZUSDPriceView(const _: unit) : nat is
    unwrap(
      (Tezos.call_view("get_price", Constants.baseQuoteName, Constants.genericOracle): option(nat)),
      Errors.wrongOContract
    );

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
        const param : contract(nat) = Tezos.self("%receivePrice");
        const receivePriceOp = Tezos.transaction(
          param,
          0mutez,
          getLPTargetContract(s.oracle)
        );
      } with receivePriceOp # operations;

      const operations = Set.fold(
        oneTokenUpd,
        tokenSet,
        (nil : list(operation))
      );
  } with (operations, s)

function receivePrice(
  const price           : nat;
  var s                 : parserStorage)
                        : parserReturn is
  block {
    mustBeOracle(s.oracle);
    const tezToUsdPrice : nat = getXTZUSDPriceView(Unit);
    const priceF : precisionValue = precision / price / tezToUsdPrice;
    const tokenId : nat = checkAssetId(Constants.assetName, s.assetId);
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