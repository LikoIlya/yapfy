[@inline] function getNormalizerContract(
  const oracleAddress   : address)
                        : contract(getType) is
  unwrap(
    (Tezos.get_entrypoint_opt("%get", oracleAddress)
                        : option(contract(getType))),
    Errors.wrongOContract
  )

[@inline] function unpackTmp(const tmp: option(bytes)): tmpPrice is
  block {
    const data = unwrap(
      (Bytes.unpack(unwrap(tmp, Errors.no_tmp)) : option(tmpPrice)),
      Errors.cant_unpack_data
    );
  } with data

[@inline] function unpackTmpOrDefault(const tmp: option(bytes)): tmpPrice is
  block {
    const default_data : tmpPrice = record[
          price = 0n;
          level = 0n;
          updating = False;
      ];
    const data = unwrap(
      (Bytes.unpack(unwrap_or(tmp, Bytes.pack(default_data))) : option(tmpPrice)),
      Errors.cant_unpack_data
    );
  } with data

[@inline] function packTmp(const data: option(tmpPrice)): option(bytes) is
  case data of [
    Some(tmp) -> Some(Bytes.pack(tmp))
    | None -> None
  ]


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
        (list[
          Tezos.transaction(
            Get(xtz_usd_price_name, param),
            0mutez,
            getNormalizerContract(s.oracle)
        )] : list(operation))
      );
      var tmp := unpackTmpOrDefault(s.tmp);
      tmp.updating := True;
  } with (operations, s with record[tmp = packTmp(Some(tmp))])

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
        var data := unpackTmpOrDefault(s.tmp);
        require(data.updating, Errors.xtz_not_updating);
        priceF := s.oraclePrecision * precision / oraclePrice;
        data := record[
          price = oraclePrice;
          level = Tezos.level;
          updating = False;
        ];
        s.tmp := packTmp(Some(data));
      }
    else {
      const tmp = unpackTmp(s.tmp);
      require(not tmp.updating, Errors.xtz_updating);
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