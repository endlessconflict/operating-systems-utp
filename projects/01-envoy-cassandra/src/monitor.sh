#!/bin/bash
echo "hora  cass_mem cass_cpu% envoy_mem envoy_cpu% conex_envoy_cass libre_MiB swap_MiB"
for i in $(seq 1 ${1:-30}); do
  c=$(docker stats --no-stream --format '{{.MemUsage}} {{.CPUPerc}}' cassandra | awk '{gsub("MiB","",$1); print $1, $4}')
  e=$(docker stats --no-stream --format '{{.MemUsage}} {{.CPUPerc}}' envoy | awk '{gsub("MiB","",$1); print $1, $4}')
  n=$(curl -s localhost:9901/stats | awk -F': ' '/^cluster.cassandra.upstream_cx_active:/{print $2}')
  m=$(free -m | awk '/Mem:/{print $4} /Swap:/{s=$3} END{print s}' | tr '\n' ' ')
  echo "$(date +%H:%M:%S) $c $e $n $m"
done
