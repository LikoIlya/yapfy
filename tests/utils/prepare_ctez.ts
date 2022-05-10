import shell from "shelljs";
import { TezosAddress } from "../../utils/helpers";

export function prepareCtezBytes(ubiOracle: TezosAddress) {
  try {
    return shell.exec(`UBINETIC_ORACLE=${ubiOracle} ./scripts/parserToBytes.sh ctez`);
  }
  catch (e) {
    console.error(e);
  }
}