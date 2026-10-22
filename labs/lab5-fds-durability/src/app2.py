import os, time
while True:
    try:
        os.open("/etc/hosts", os.O_RDONLY)
    except OSError as e:
        print("error:", e, flush=True)
    time.sleep(0.1)
