#! /bin/sh
PARSER="$(echo "${1}" | tr '[:upper:]' '[:lower:]')"
if [ "$PARSER" = "ctez" ]; then
  set -o allexport
  if [ ! "$UBINETIC_ORACLE" ]; then
    [ -f .env ] && . .env
  fi
  UBINETIC_ORACLE=${UBINETIC_ORACLE:-"tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg"}
  sed -i.bak "s/{env.UBINETIC_ORACLE}/$UBINETIC_ORACLE/gi" ./contracts/partial/parser/vendor/ctez/constants.ligo
fi
if [ "$PARSER" = "sirs_lp" ]; then
  set -o allexport
  if [ ! "$HARBINGER_ORACLE" ]; then
    [ -f .env ] && . .env
  fi
  HARBINGER_ORACLE=${HARBINGER_ORACLE:-"tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg"}
  sed -i.bak "s/{env.HARBINGER_ORACLE}/$HARBINGER_ORACLE/gi" ./contracts/partial/parser/vendor/harbinger/sirs_lp/constants.ligo
fi
yarn cli compile -F tz -c parser/$PARSER
if [ "$PARSER" = "ctez" ]; then
  mv ./contracts/partial/parser/vendor/ctez/constants.ligo.bak ./contracts/partial/parser/vendor/ctez/constants.ligo
  set +o allexport
fi
if [ "$PARSER" = "sirs_lp" ]; then
  mv ./contracts/partial/parser/vendor/ubinetic/sirs_lp/constants.ligo.bak ./contracts/partial/parser/vendor/ubinetic/sirs_lp/constants.ligo
  set +o allexport
fi

