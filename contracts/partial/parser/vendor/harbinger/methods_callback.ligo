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
      (Bytes.unpack(unwrap(tmp, Errors.noTmp)) : option(tmpPrice)),
      Errors.cantUnpackData
    );
  } with data

[@inline] function unpackTmpOrDefault(const tmp: option(bytes)): tmpPrice is
  block {
    const default_data: tmpPrice = (
        record[
            price = 0n;
            level = 0n;
            size = 0n;
            state = Idle;
        ]: tmpPrice
      );
    const data = unwrap(
      (Bytes.unpack(unwrap_or(tmp, Bytes.pack(default_data))) : option(tmpPrice)),
      Errors.cantUnpackData
    );
  } with data

[@inline] function packTmp(const data: option(tmpPrice)): option(bytes) is
  case data of [
    Some(tmp) -> Some(Bytes.pack(tmp))
    | None -> None
  ]


function getPrice(
  const tokenSet        : tokenSet;
  const s               : parserStorage)
                        : parserReturn is
  block {
    var tmp := unpackTmpOrDefault(s.tmp);
    require(tmp.state = Idle, Errors.invalidState)
    require(Set.cardinal(tokenSet) > 0n, Errors.zeroSet);
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
      tmp.state := WaitingUsdPrice;
      tmp.size := abs(List.size(operations) - 1n);
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
    var tmp := unpackTmp(s.tmp);
    if (usd) then {
      require(tmp.state = WaitingUsdPrice, Errors.invalidState);
      priceF := s.oraclePrecision * precision / oraclePrice;
      s.tmp := packTmp(Some(tmp with record [
        price = oraclePrice;
        level = Tezos.level;
        state = WaitingAssetPrice(0n);
      ]));
    }
    else {
      const idx = case tmp.state of [
        WaitingAssetPrice(num) -> num
        | _ -> (failwith(Errors.invalidState): nat)
      ];
      require(tmp.level = Tezos.level, Errors.timestampLimit);
      priceF := oraclePrice * precision / tmp.price;
      if idx = tmp.size
      then {
        tmp.state := Idle;
        tmp.size := 0n;
      }
      else tmp.state := WaitingAssetPrice(idx + 1n);
      s.tmp := packTmp(Some(tmp));
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