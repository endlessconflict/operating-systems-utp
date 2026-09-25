#!/usr/bin/env python3
# Uso: ./medir.py <escenario> [peticiones]
# Llama a /login varias veces y guarda los tiempos en resultados.csv
import json, sys, time, urllib.request

escenario = sys.argv[1]
n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
totales = []
print("Escenario:", escenario)
print("req   io(s)   cpu(s)  total(s)  cliente(s)")
for i in range(1, n + 1):
    t0 = time.time()
    d = json.load(urllib.request.urlopen("http://localhost:5000/login"))
    cliente = time.time() - t0
    totales.append(cliente)
    print("%3d  %6.3f  %7.3f  %8.3f  %9.3f" % (i, d["io_time_seconds"], d["cpu_time_seconds"], d["total_time_seconds"], cliente))
    with open("resultados.csv", "a") as f:
        f.write("%s,%d,%s,%s,%s,%.4f\n" % (escenario, i, d["io_time_seconds"], d["cpu_time_seconds"], d["total_time_seconds"], cliente))
print("promedio cliente: %.3f s   min: %.3f s   max: %.3f s" % (sum(totales) / n, min(totales), max(totales)))
