#include "../parser/storage.ligo"

type deploy_func_t is (option(key_hash) * tez * parserStorage) -> (operation * address)