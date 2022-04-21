# Yet Another Price Feed for [Yupana](https://github.com/madfish-solutions/yupana-protocol-core "Yupana")

[Yupana](https://github.com/madfish-solutions/yupana-protocol-core "Yupana")'s price feed implementation, allows to use multiple oracles with one contract.

## Requirements

- Installed NodeJS (tested with NodeJS v14+)
- Installed Yarn
- Docker

- Installed node modules:

```sh
yarn install
```

## Compile
### Compile contract

```sh
yarn compile -c router
```

### Compile bytes

> **WARNING:** before compiling parsers make sure that [.env](./.env.example) file has all needed variables, especially correct **oracle addresses**

Compile parser contract

```sh
yarn compile-parser ${parserName}
```

ex. 

```sh 
yarn compile-parser harbinger
```

Compile and prepare parser bytes

```sh 
yarn parser-to-bytes ${parserName}
```

ex. 
```sh
yarn parser-to-bytes harbinger
```

### Compile all

```sh
yarn compile-all
```

## Testing
### Start Tezos Flextesa sandbox local chain

Flextesa sandbox run in Docker container, but you can change the [config](./config.ts) file properties to connect to another RPC nodes if you want to.

```sh
yarn start-sandbox
```

### Start Jest tests

Repository has some tests with Taquito and Jest located inside [tests](./tests) folder.

```sh
yarn test
``` 

### Stop local chain

If you had started the local chain before the running tests, recomended to stop the chain right after the tests.

```sh
yarn stop-sandbox
```

# Deploy contract


```sh
yarn migrate
```
