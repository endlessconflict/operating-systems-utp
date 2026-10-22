#!/bin/bash
# LAB 0 — prepara entorno Redis (real si hay binario, simulado si no). Rootless, sin sudo.
set -u
DIR=/tmp/redis-lab0
mkdir -p "$DIR"
USAGE="Uso: $0 {setup|clean|info}"

cmd=${1:-setup}
case "$cmd" in
  setup)
    if command -v redis-server >/dev/null 2>&1; then
      if ! pgrep -x redis-server >/dev/null 2>&1; then
        redis-server --port 7777 --dir "$DIR" --dbfilename dump.rdb \
          --appendonly yes --appendfilename appendonly.aof \
          --daemonize yes --logfile "$DIR/redis.log" 2>/dev/null \
        && echo "redis-server efímero en puerto 7777 (dir=$DIR)" \
        || echo "no se pudo lanzar redis-server; se usa simulación con archivos"
      else
        echo "redis-server ya corría: $(pgrep -o redis-server)"
      fi
    else
      echo "(sin redis-server instalado: simulación con archivos)"
    fi
    # En ambos casos deja archivos para pasos 3-5
    [ -f "$DIR/dump.rdb" ] || head -c 1048576 /dev/urandom > "$DIR/dump.rdb" 2>/dev/null
    [ -f "$DIR/appendonly.aof" ] || printf '*2\r\n$3\r\nSET\r\n$1\r\nx\r\n' > "$DIR/appendonly.aof"
    echo "demo" > "$DIR/demo.txt"
    ls -l "$DIR"
    ;;
  info)
    SVC=$(pgrep -o redis-server 2>/dev/null || echo $$)
    echo "PID=$SVC"
    ls -l /proc/$SVC/fd/ 2>/dev/null | head -15
    grep "open files" /proc/$SVC/limits 2>/dev/null
    redis-cli -p 7777 info persistence 2>/dev/null | grep -E "rdb_|aof_" || echo "(sin redis-cli o sin instancia: ver archivos en $DIR)"
    ;;
  clean)
    redis-cli -p 7777 shutdown nosave 2>/dev/null || true
    rm -rf "$DIR"
    echo "limpio"
    ;;
  *) echo "$USAGE" ;;
esac
