#include "../../partial/types.ligo"

type parserStorage      is [@layout:comb] record[
  router                  : address;
  oracle                  : address;
  oraclePrecision         : nat;
  timestampLimit          : int;
  assetName               : big_map(tokenId, assetString);
  assetId                 : big_map(assetString, tokenId);
  metadata                : big_map(string, bytes);
  tmp                     : option(bytes);
]

type parserReturn is list(operation) * parserStorage
