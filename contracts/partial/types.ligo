type tokenId            is nat;
type assetString        is string;
type tokenSet           is set(tokenId);

type precisionValue     is nat;

type updateOracleParams is [@layout:comb] record[
  oracle                  : address;
  oraclePrecision         : nat;
  timestampLimit          : nat;
]

type updateAssetParams is [@layout:comb] record[
  assetName               : assetString;
  tokenId                 : tokenId;
]

type parserResponse     is [@layout:comb] record [
  tokenId                 : tokenId;
  priceF                  : precisionValue;
]

type yAssetParams       is [@layout:comb] record [
  tokenId               : tokenId;
  amount                : nat;
]