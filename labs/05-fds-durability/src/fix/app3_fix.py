import socket, time
while True:
    try:
        with socket.create_connection(("127.0.0.1", 3306)) as s:
            pass
    except OSError as e:
        print("error:", e, flush=True)
    time.sleep(0.1)
