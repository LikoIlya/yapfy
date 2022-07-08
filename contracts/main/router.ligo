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
    s := case p of [
      | SetProxyAdmin(params)     -> setAdmin(params, s)
      | ApproveProxyAdmin         -> approveAdmin(s)
      | AddParserType(params)     -> addParserBytes(params, s)
      | UpdateYToken(params)      -> updateYToken(params, s)
      | _                         -> s
    ];
    const operations: list(operation) = case p of [
      | GetPrice(params)          -> getPrice(params, s)
      | ReceivePrice(params)      -> receiveParsedPrice(params, s)
      | SetTimeLimit(params)      -> setTimeLimit(params, s)
      | _                         -> nil
    ]
  } with case p of [
    | UpdateOracle(params)      -> updateOracle(params, s)
    | UpdateAsset(params)       -> updateAsset(params, s)
    | ConnectOracle(params)     -> connectNewOracle(params, s)
    | _                         -> (operations, s)
  ]
