import shell from "shelljs";
import { TezosAddress } from "../../utils/helpers";

export function prepareCtezBytes(ubiOracle: TezosAddress, silent = false): string {
  try {
    return shell.exec(`UBINETIC_ORACLE=${ubiOracle} ./scripts/parserToBytes.sh ctez`, { silent });
  }
  catch (e) {
    console.error(e);
  }
}