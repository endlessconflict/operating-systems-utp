#!/bin/bash
mkdir -p logs
for t in 8 32 64 128; do
  echo "== etapa: $t hilos de escritura =="
  docker run --rm --network proyecto1_default -m 400m --cpus 0.5 -e JVM_OPTS=-Xmx256m --entrypoint /opt/cassandra/tools/bin/cassandra-stress cassandra:5.0 write duration=40s -rate threads=$t -node envoy -mode native cql3 > logs/stress_$t.log 2>&1 &
  sleep 15
  ./monitor.sh 4 | tee -a logs/monitor.log
  wait
  grep -E "^(Op rate|Latency mean|Latency 99th|Total errors)" logs/stress_$t.log | tail -4
  oom=$(docker inspect -f '{{.State.OOMKilled}}' cassandra envoy | tr '\n' ' ')
  echo "OOMKilled cassandra/envoy: $oom"
  pct=$(docker stats --no-stream --format '{{.MemPerc}}' cassandra | tr -d '%' | cut -d. -f1)
  if [ "$pct" -ge 95 ]; then echo "memoria al ${pct}%: se detiene la prueba"; break; fi
  sleep 10
done
