#! /bin/sh
yarn compile-parser ${1};
yarn cli get-parser-bytes --parser ${1}

