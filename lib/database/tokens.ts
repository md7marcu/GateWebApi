import { find } from "lodash";
import { config } from "node-config-ts";

const Tokens = {
    findToken(token, callBack){
        let found = find(config.validTokens, ["key", token])

        return callBack(null, found !== undefined);            
    }
}
export default Tokens;