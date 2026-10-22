import os, time
while True:
    try:
        with open("/etc/hosts") as f:
            f.read()
    except OSError as e:
        print("error:", e, flush=True)
    time.sleep(0.1)
