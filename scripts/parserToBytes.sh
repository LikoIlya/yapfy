#! /bin/sh
PARSER="$(echo "${1}" | tr '[:upper:]' '[:lower:]')"
yarn compile-parser "$PARSER";
yarn cli get-parser-bytes --parser "$PARSER"

