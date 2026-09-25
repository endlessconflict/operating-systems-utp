import os
import sys
import time
import signal
import hashlib
import subprocess
import threading
from flask import Flask, jsonify

app = Flask(__name__)

CPU_TARGET_SECONDS = float(os.environ.get("LOGIN_CPU_SECONDS", "0.5"))
STRESS_WORKERS = os.environ.get("STRESS_WORKERS", "20")

_stress = None
_lock = threading.Lock()


def _hash_loop(iterations):
    for _ in range(iterations):
        hashlib.sha256(b"login_token").hexdigest()


def _calibrate_iterations(target_seconds):
    sample = 5000
    start = time.perf_counter()
    _hash_loop(sample)
    elapsed = time.perf_counter() - start
    return max(1, int(sample * target_seconds / elapsed))


LOGIN_ITERATIONS = _calibrate_iterations(CPU_TARGET_SECONDS)


@app.route('/login')
def login():
    t0 = time.perf_counter()
    time.sleep(2)
    t1 = time.perf_counter()
    _hash_loop(LOGIN_ITERATIONS)
    t2 = time.perf_counter()
    return jsonify({
        "status": "success",
        "io_time_seconds": round(t1 - t0, 4),
        "cpu_time_seconds": round(t2 - t1, 4),
        "total_time_seconds": round(t2 - t0, 4),
        "cpu_iterations": LOGIN_ITERATIONS,
        "pid": os.getpid(),
        "tid": threading.get_ident(),
    })


@app.route('/start-cpu-stress')
def start_stress():
    global _stress
    with _lock:
        if _stress is not None and _stress.poll() is None:
            return jsonify({
                "message": "el estres ya esta activo",
                "stress_pid": _stress.pid,
            })
        _stress = subprocess.Popen(
            [sys.executable, "stress.py"],
            env={**os.environ, "STRESS_WORKERS": STRESS_WORKERS},
            start_new_session=True,
        )
        return jsonify({
            "message": f"estres CPU iniciado con {STRESS_WORKERS} procesos",
            "stress_pid": _stress.pid,
        })


@app.route('/stop-cpu-stress')
def stop_stress():
    global _stress
    with _lock:
        if _stress is None or _stress.poll() is not None:
            _stress = None
            return jsonify({"message": "no hay estres activo"})
        os.killpg(os.getpgid(_stress.pid), signal.SIGTERM)
        _stress.wait(timeout=10)
        _stress = None
        return jsonify({"message": "estres detenido"})


@app.route('/status')
def status():
    active = _stress is not None and _stress.poll() is None
    return jsonify({
        "pid": os.getpid(),
        "nice": os.getpriority(os.PRIO_PROCESS, 0),
        "affinity": sorted(os.sched_getaffinity(0)),
        "login_cpu_target_seconds": CPU_TARGET_SECONDS,
        "login_iterations": LOGIN_ITERATIONS,
        "stress_active": active,
        "stress_pid": _stress.pid if active else None,
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
