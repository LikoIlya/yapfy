function approveAdmin(
  var s                 : routerStorage)
                        : routerStorage is
  block {
    const admin_candidate : address = unwrap(s.admin_candidate, Errors.noCandidate);
    require(Tezos.sender = admin_candidate or Tezos.sender = s.admin, Errors.notAdminOrCandidate);
    s.admin := Tezos.sender;
    s.admin_candidate := (None : option(address));
  } with s

function setAdmin(
  const newAdmin        : address;
  var s                 : routerStorage)
                        : routerStorage is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
  } with s with record [ admin_candidate = Some(newAdmin) ];

function updateYToken(
  const addr            : address;
  var s                 : routerStorage)
                        : routerStorage is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
  } with s with record [ yToken = addr ];

function addParserBytes(
  const params          : addBytesParam;
  var s                 : routerStorage)
                        : routerStorage is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
    require_none(s.parserBytes[params.parserType], Errors.typeSet);
    s.parserBytes[params.parserType] := params.initFunction;
  } with s


function getPrice(
  const tokenSet        : tokenSet;
  const s               : routerStorage)
                        : list(operation) is
  block {
    function mapTokensToParsers(
      var acc             : map(address, tokenSet);
      const tokenId       : tokenId)
                          : map(address, tokenSet) is
      block {
        const parser = unwrap(s.tokenIdToParser[tokenId], Errors.unknownToken);
        const tokens = unwrap_or(acc[parser], (set[]: tokenSet));
        acc[parser] := Set.add(tokenId, tokens);
      } with acc;
    const parserRequests = Set.fold(
      mapTokensToParsers,
      tokenSet,
      (map[]: map(address, tokenSet))
    );
    function paramsToOperations(
      const acc           : list(operation);
      const entry         : address * tokenSet)
                          : list(operation) is
      block {
        const parserAddress = entry.0;
        const params = entry.1;
        const operation = Tezos.transaction(
          params,
          0mutez,
          getParser(parserAddress)
        )
      } with operation # acc
  } with Map.fold(paramsToOperations, parserRequests, (nil:list(operation)))

function receiveParsedPrice(
  const params          : parserResponse;
  const s               : routerStorage)
                        : list(operation) is
  block {
    require(Big_map.mem(Tezos.sender, s.parserOracle), Errors.notParser);
    const decimals : nat = getDecimal(params.tokenId, s.decimals);
  } with list[
      Tezos.transaction(
        record [
          tokenId = params.tokenId;
          amount = params.priceF / decimals;
        ],
        0mutez,
        getYTokenPriceCallbackMethod(s.yToken)
      )
    ]

function setTimeLimit(
  const params          : setTimeLimit;
  const s               : routerStorage)
                        : list(operation) is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin)
  } with list[
    Tezos.transaction(
      params.timestampLimit,
      0mutez,
      getParserTimestampSetter(params.parser)
    )
  ];

function updateAsset(
  const params          : assetParam;
  var s                 : routerStorage)
                        : routerReturn is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
    const paramsParser: updateAssetParams = record [
      assetName = params.assetName;
      tokenId = params.tokenId;
    ];
    const parser = unwrap(s.oracleParser[params.oracle], Errors.noParser);
    const operations = list[
      Tezos.transaction(
        paramsParser,
        0mutez,
        getParserAssetSetter(parser)
      )
    ];
    s.decimals[params.tokenId] := params.decimals;
    s.tokenIdToParser[params.tokenId] := parser;
  } with (operations, s)

function updateOracle(
  const params          : parserOracleUpdate;
  var s                 : routerStorage)
                        : routerReturn is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
    const old_oracle = unwrap(s.parserOracle[params.parser], Errors.noParser);
    require(not Big_map.mem(params.oracle, s.oracleParser), Errors.parserSet);
    const paramsParser: updateOracleParams = record [
      oracle          = params.oracle;
      oraclePrecision = params.oraclePrecision;
      timestampLimit  = params.timestampLimit
    ];
    const operations = list[
      Tezos.transaction(
        paramsParser,
        0mutez,
        getParserOracleSetter(params.parser)
      )
    ];
    s.parserOracle[params.parser] := params.oracle;
    s.oracleParser := Big_map.remove(old_oracle, s.oracleParser);
    s.oracleParser[params.oracle] := params.parser;
  } with (operations, s)

function connectNewOracle(
  const params          : connectNewOracle;
  var s                 : routerStorage)
                        : routerReturn is
  block {
    require(Tezos.sender = s.admin, Errors.notAdmin);
    const parserStorage : parserStorage = record [
      router          = Tezos.self_address;
      assetName       = (big_map[]: big_map(tokenId, assetString));
      assetId         = (big_map[]: big_map(assetString, tokenId));
      metadata        = Constants.default_parser_metadata;
      oracle          = params.oracle;
      oraclePrecision = params.oraclePrecision;
      timestampLimit  = int(params.timestampLimit);
    ];
    const (operation, parser) = deployFromBytes(
      unwrap(s.parserBytes[params.parserType], Errors.noParserType),
      parserStorage
    );
    s.parserOracle[parser] := params.oracle;
    s.oracleParser[params.oracle] := parser;
  } with (list[operation], s)
