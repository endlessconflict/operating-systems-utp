import socket, time
pool = []
while True:
    try:
        pool.append(socket.create_connection(("127.0.0.1", 3306)))
    except OSError as e:
        print("error:", e, flush=True)
    time.sleep(0.1)
