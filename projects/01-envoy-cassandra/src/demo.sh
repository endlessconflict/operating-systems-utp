#!/bin/bash
cd ~/proyecto1
P=$'\e[1;33m(Grupo 2)\e[0m \e[1;32mvagrant@so-environment\e[0m:\e[1;34m~/proyecto1\e[0m$ '
run() {
  printf '%s' "$P"
  for ((i=0;i<${#1};i++)); do printf '%s' "${1:i:1}"; sleep 0.03; done
  printf '\n'
  bash -c "$1" < /dev/tty
  sleep ${2:-3}
}
clear
run "free -m && nproc" 4
run "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'" 4
run "docker inspect -f '{{.Name}} Memory={{.HostConfig.Memory}} MemorySwap={{.HostConfig.MemorySwap}} NanoCpus={{.HostConfig.NanoCpus}}' envoy cassandra" 5
run "for c in envoy cassandra; do id=\$(docker inspect -f '{{.Id}}' \$c); d=/sys/fs/cgroup/system.slice/docker-\$id.scope; echo \$c; cat \$d/memory.max \$d/memory.swap.max \$d/cpu.max; done" 5
run "docker stats --no-stream" 4
run "ps aux | grep -E '[e]nvoy -c|[o]penjdk' | cut -c1-170" 4
run "docker exec cassandra grep -E '^(memtable_offheap_space|file_cache_size|native_transport_max_concurrent_connections):' /etc/cassandra/cassandra.yaml" 4
run "curl -s localhost:9901/server_info | grep concurrency" 4
run "docker exec cassandra cqlsh envoy 9042 -e \"SELECT cluster_name, release_version FROM system.local\"" 4
clear
run "docker restart envoy >/dev/null; sleep 8; python3 conexiones.py" 5
clear
run "docker run -d --rm --name carga --network proyecto1_default -m 400m --cpus 0.5 -e JVM_OPTS=-Xmx256m --entrypoint /opt/cassandra/tools/bin/cassandra-stress cassandra:5.0 write duration=60s -rate threads=32 -node envoy -mode native cql3 >/dev/null; sleep 20" 1
run "./monitor.sh 4" 2
run "timeout --foreground 14 htop" 1
run "docker stats --no-stream" 4
clear
run "docker run --name oomtest -m 64m --memory-swap 64m python:3.11-slim python -c 'x = bytearray(300*1024*1024)'; echo codigo_salida=\$?" 3
run "docker inspect -f 'OOMKilled={{.State.OOMKilled}}' oomtest; docker rm oomtest >/dev/null; docker ps --format '{{.Names}} {{.Status}}'" 5
printf '%s\n' "$P"
sleep 3
