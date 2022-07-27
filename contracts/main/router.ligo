#include "../helpers.ligo"
#import  "../partial/router/errors.ligo" "Errors"
#import  "../partial/router/constants.ligo" "Constants"
#include  "../partial/router/deploy.ligo"
#include  "../partial/router/storage.ligo"
#include  "../partial/router/helpers.ligo"
#include  "../partial/router/methods.ligo"


function main(
  const p               : routerAction;
  var s                 : routerStorage)
                        : routerReturn is
  block {
    non_tez_operation(Unit);
  } with case p of [
    // storage update only actions
    | SetProxyAdmin(params)     -> (no_operations, setAdmin(params, s))
    | ApproveProxyAdmin         -> (no_operations, approveAdmin(s))
    | AddParserType(params)     -> (no_operations, addParserBytes(params, s))
    | UpdateYToken(params)      -> (no_operations, updateYToken(params, s))
    // operation create only actions
    | GetPrice(params)          -> (getPrice(params, s), s)
    | ReceivePrice(params)      -> (receiveParsedPrice(params, s), s)
    | SetTimeLimit(params)      -> (setTimeLimit(params, s), s)
    // storage update and operation create actions
    | UpdateOracle(params)      -> updateOracle(params, s)
    | UpdateAsset(params)       -> updateAsset(params, s)
    | ConnectOracle(params)     -> connectNewOracle(params, s)
  ]
