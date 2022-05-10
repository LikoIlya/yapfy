import  { MichelsonMap }  from"@taquito/michelson-encoder";
import BigNumber from "bignumber.js"

export const tokenPrices = {
  "cTez": new BigNumber("1.25")
}

export default {
  cfmm_address: "KT1H5b7LxEExkFd2Tng77TfuWbM5aPvHstPr",
  ctez_fa12_address: "KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4",
  drift: 920892,
  last_drift_update: (Date.now()/ 1000).toFixed(),
  metadata: new MichelsonMap(),
  ovens: new MichelsonMap(),
  target: tokenPrices.cTez.multipliedBy(
    new BigNumber(2).pow(48)
  ).toFixed(0)
}
