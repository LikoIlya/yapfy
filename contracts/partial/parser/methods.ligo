function setTimeLimit(
  const limit           : nat;
  var s                 : parserStorage)
                        : parserStorage is
  block {
    mustBeRouter(s.router);
  } with s with record [ timestampLimit = int(limit) ]

function updateOracle(
  const params          : updateOracleParams;
  var s                 : parserStorage)
                        : parserStorage is
  block {
    mustBeRouter(s.router);
  } with s with record [ 
    oracle = params.oracle;
    oraclePrecision = params.oraclePrecision;
    timestampLimit = int(params.timestampLimit)
  ]

function updateAsset(
  const param           : updateAssetParams;
  var s                 : parserStorage)
                        : parserStorage is
  block {
    mustBeRouter(s.router);
    s.assetName[param.tokenId] := param.assetName;
    // s.assetId[param.assetName] := param.tokenId;
  } with s