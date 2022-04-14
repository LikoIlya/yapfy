type addBytesParam      is [@layout:comb] record[
  parserType              : string;
  initFunction            : bytes;
]

type assetParam         is [@layout:comb] record [
  tokenId               : tokenId;
  assetName             : assetString;
  decimals              : nat;
  oracle                : address;
]

type parserOracleUpdate is [@layout:comb] record [
  oracle                  : address;
  oraclePrecision         : nat;
  timestampLimit          : nat;
  parser                  : address;
]

type setTimeLimit       is [@layout:comb] record [
  timestampLimit          : nat;
  parser                  : address;
]

type connectNewOracle   is [@layout:comb] record [
  oracle                  : address;
  oraclePrecision         : nat;
  timestampLimit          : nat;
  parserType              : string;
]

type routerStorage      is [@layout:comb] record [
  admin                   : address;
  admin_candidate         : option(address);
  yToken                  : address;
  tokenIdToParser         : big_map(tokenId, address);
  decimals                : big_map(tokenId, nat);
  oracleParser            : big_map(address, address);
  parserOracle            : big_map(address, address);
  parserBytes             : big_map(string, bytes);
  metadata                : big_map(string, bytes);
]

type routerReturn is list(operation) * routerStorage

type routerAction       is
| SetProxyAdmin           of address
| ApproveProxyAdmin       of unit
| AddParserType           of addBytesParam
| UpdateYToken            of address
| GetPrice                of tokenSet
| ReceivePrice            of parserResponse
| SetTimeLimit            of setTimeLimit
| UpdateOracle            of parserOracleUpdate
| UpdateAsset             of assetParam
| ConnectOracle           of connectNewOracle