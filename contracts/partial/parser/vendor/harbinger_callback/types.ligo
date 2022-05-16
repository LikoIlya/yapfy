type receivePriceParams   is (string * (timestamp * nat))

type getType is Get of string * contract(receivePriceParams)
