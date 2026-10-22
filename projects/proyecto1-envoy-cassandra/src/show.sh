#!/bin/bash
P=$'\e[1;33m(Grupo 2)\e[0m \e[1;32mvagrant@so-environment\e[0m:\e[1;34m~/proyecto1\e[0m$ '
cd ~/proyecto1 2>/dev/null
while IFS= read -r line; do
  [ -z "$line" ] && continue
  printf '%s%s\n' "$P" "$line"
  bash -c "$line" < /dev/tty
done < "$1"
printf '%s\n' "$P"
read -r -n1
