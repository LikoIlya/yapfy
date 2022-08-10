type receivePriceParams   is (string * (timestamp * nat))
type getType is Get of string * contract(receivePriceParams)
type stateEnum is
| Idle              of unit
| WaitingUsdPrice   of unit
| WaitingAssetPrice of nat


type tmpPrice           is [@layout:comb] record[
    price                 : nat;
    level                 : nat;
    size                  : nat;
    state                 : stateEnum;
  ]
