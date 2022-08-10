type receivePriceParams   is (string * (timestamp * nat))
type getType is Get of string * contract(receivePriceParams)


type tmpPrice           is [@layout:comb] record[
    price                 : nat;
    level                 : nat;
    updating              : bool;
  ]
