# Genera STRESS_WORKERS procesos que queman CPU sin parar.
# STRESS_NICE fija la prioridad (nice) de cada proceso: menor = mas prioridad.
import os
import multiprocessing as mp

WORKERS = int(os.environ.get("STRESS_WORKERS", "20"))
NICE = int(os.environ.get("STRESS_NICE", "0"))


def quemar_cpu():
    os.setpriority(os.PRIO_PROCESS, 0, NICE)
    while True:
        pass


if __name__ == "__main__":
    procesos = [mp.Process(target=quemar_cpu) for _ in range(WORKERS)]
    for p in procesos:
        p.start()
    for p in procesos:
        p.join()
