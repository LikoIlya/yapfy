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
  const s                : parserStorage)
                        : parserReturn is
  block {
    const param : contract(receivePriceParams) = Tezos.self("%receivePrice");
    function oneTokenUpd(
      const operations  : list(operation);
      const tokenId     : nat)
                        : list(operation) is
      block {
        const strName : string = checkAssetName(tokenId, s.assetName);
        const receivePriceOp = Tezos.transaction(
          Get(strName, param),
          0mutez,
          getNormalizerContract(s.oracle)
        );
      } with if strName = xtz_usd_price_name then operations else receivePriceOp # operations;
      const operations = Set.fold(
        oneTokenUpd,
        tokenSet,
        (list[Tezos.transaction(
            Get(xtz_usd_price_name, param),
            0mutez,
            getNormalizerContract(s.oracle)
        )] : list(operation))
      );
      var tmp := unwrap_or(s.tmp, record[
          price = 0n;
          level = 0n;
          updating = False;
        ]);
      tmp.updating := True;
  } with (operations, s with record[tmp = Some(tmp)])

function receivePrice(
  const param           : receivePriceParams;
  var s                 : parserStorage)
                        : parserReturn is
  block {
    mustBeOracle(s.oracle);
    checkTimestamp(param.1.0, s.timestampLimit);
    const assetName : string = param.0;
    const oraclePrice = param.1.1;
    const usd : bool = (assetName = xtz_usd_price_name); // if price is XTZ/USD
    var priceF : precisionValue := 0n;
    if (usd) then {
        var data := unwrap_or(s.tmp, record[
          price = oraclePrice;
          level = Tezos.level;
          updating = False;
        ]);
        require(data.updating, "XTZ_NOT_UPDATING");
        priceF := s.oraclePrecision * precision / oraclePrice;
        data := record[
          price = oraclePrice;
          level = Tezos.level;
          updating = False;
        ];
        s.tmp := Some(data);
      }
    else {
      const tmp = unwrap(s.tmp, "NO_TMP");
      require(not tmp.updating, "XTZ_UPDATING");
      require(tmp.level = Tezos.level, Errors.timestampLimit);
      priceF := oraclePrice * precision / tmp.price;
    };
    const tokenId : nat = checkAssetId(assetName, s.assetId);
    const operations = list[
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