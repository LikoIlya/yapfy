# Yet Another Price Feed for [Yupana](https://github.com/madfish-solutions/yupana-protocol-core "Yupana")

[Yupana](https://github.com/madfish-solutions/yupana-protocol-core "Yupana")'s price feed implementation, allows to use multiple oracles with one contract.

# Requirements

- Installed NodeJS (tested with NodeJS v14+)
- Installed Yarn

- Installed node modules:

```
yarn install

```

# Compile contract

```
yarn compile router

```

# Compile bytes

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


# Quick Start tests

```
yarn start-sandbox

```


```
yarn test

``` 


```
yarn stop-sandbox

```

# Deploy contract

```
yarn migrate

```
