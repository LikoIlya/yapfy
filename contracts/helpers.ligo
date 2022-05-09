const precision = 1_000_000_000_000_000_000_000_000_000_000_000_000n;

function require(
  const param           : bool;
  const error           : string)
                        : unit is
  assert_with_error(param, error)

function check_permission(
  const address_        : address;
  const error           : string)
                        : unit is
  require(Tezos.sender = address_, error)

function require_none<a>(
  const param           : option(a);
  const error           : string)
                        : unit is
  case param of [
  | Some(_) -> failwith(error)
  | None -> unit
  ]

function unwrap_or<a>(
  const param           : option(a);
  const default         : a)
                        : a is
  case param of [
  | Some(instance) -> instance
  | None -> default
  ]

function unwrap<a>(
  const param           : option(a);
  const error           : string)
                        : a is
  case param of [
  | Some(instance) -> instance
  | None -> failwith(error)
  ]

function get_nat_or_fail(
  const value           : int;
  const error           : string)
                        : nat is
  case is_nat(value) of [
  | Some(natural) -> natural
  | None -> (failwith(error): nat)
  ]