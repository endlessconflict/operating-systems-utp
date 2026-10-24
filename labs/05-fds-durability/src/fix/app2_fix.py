import os, time
while True:
    try:
        fd = os.open("/etc/hosts", os.O_RDONLY)
        try:
            os.read(fd, 1024)
        finally:
            os.close(fd)
    except OSError as e:
        print("error:", e, flush=True)
    time.sleep(0.1)
