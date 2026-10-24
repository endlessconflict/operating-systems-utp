import os, socket, time
socks = []
for objetivo in (50, 100, 150, 200):
    while len(socks) < objetivo:
        try:
            socks.append(socket.create_connection(("127.0.0.1", 9042), timeout=3))
        except OSError as e:
            print("error:", e)
            break
    time.sleep(6)
    print("== conexiones abiertas por el cliente:", len(socks))
    os.system("curl -s localhost:9901/stats | grep -E '^cluster.cassandra.upstream_cx_(active|overflow):'")
time.sleep(10)
print("== 10 s despues, con 200 conexiones del cliente aun abiertas")
os.system("curl -s localhost:9901/stats | grep -E '^cluster.cassandra.upstream_cx_(active|overflow):'")
