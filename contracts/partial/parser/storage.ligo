#include "../../partial/types.ligo"

type tmpPrice           is [@layout:comb] record[
    price                 : nat;
    level                 : nat;
    updating              : bool;
  ]

type parserStorage      is [@layout:comb] record[
  router                  : address;
  oracle                  : address;
  oraclePrecision         : nat;
  timestampLimit          : int;
  assetName               : big_map(tokenId, assetString);
  assetId                 : big_map(assetString, tokenId);
  metadata                : big_map(string, bytes);
  tmp                     : option(tmpPrice);
]

type parserReturn is list(operation) * parserStorage
