"""
app.py - Microservicio Flask "intencionalmente vulnerable" para el laboratorio de
Gestión de Memoria y Resiliencia en Linux/Docker (Sistemas Operativos, 4.º año).

Este microservicio simula una aplicación de producción con fallas intencionadas
de consumo de memoria para que los estudiantes diagnostiquen incidentes reales:
  - OOM Killer (Exit Code 137)
  - Thrashing / Hiperpaginación por Swap
  - Fallos estrictos de límites cgroups v2

Rol del estudiante: SysAdmin / SRE / DevOps. NO debe modificar este archivo;
debe diagnosticar y resolver los incidentes a nivel de contenedor y sistema.
"""

import gc
import os
import time

from flask import Flask, jsonify, request

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Estado global del "proceso de producción". Las estructuras globales son la
# causa raíz de la fuga de memoria: nunca se limpiarán por sí solas.
# ---------------------------------------------------------------------------
LEAK_BUCKETS = []          # Lista global que acumula bloques de memoria (nunca liberada).
REPORT_BUFFER = None       # Buffer temporal que simula un reporte pesado.
ANALYTICS_BUFFER = None    # Buffer cargado por el endpoint de analíticas.
ANALYTICS_PAGES = []       # Ventanas de páginas "tocadas" por el proceso de analíticas.


def _extraer_mb(request, default=1):
    """
    Lee el parámetro ?mb=N de la query string. Devuelve un entero no negativo.
    Si el parámetro es inválido o excesivo, se recorta para evitar abusos.
    """
    try:
        mb = int(request.args.get("mb", default))
    except (TypeError, ValueError):
        mb = default
    return max(0, min(mb, 512))  # Límite de seguridad a nivel de aplicación.


def _estado_memoria():
    """
    Devuelve un snapshot del estado de memoria del proceso para los endpoints
    de diagnóstico. Permite a los estudiantes correlacionar lo que ven con
    /proc/<PID>/status y dmesg.
    """
    status = {}
    try:
        with open(f"/proc/{os.getpid()}/status") as fh:
            for line in fh:
                if line.startswith(("VmRSS", "VmSize", "VmSwap")):
                    key, value = line.split(":", 1)
                    status[key] = value.strip()
    except FileNotFoundError:
        status["error"] = "No se pudo leer /proc (entorno sin procfs)"
    status["pid"] = os.getpid()
    return status


# ---------------------------------------------------------------------------
# 1. Endpoint de healthcheck: solo devuelve estado 'ok' y el PID.
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """Healthcheck básico. No consume memoria; útil para verificar que el
    contenedor sigue respondiendo durante un incidente."""
    return jsonify({"status": "ok", "pid": os.getpid(), "message": "Servicio vivo"})


# ---------------------------------------------------------------------------
# 2. Fuga de memoria intencional: asigna N MB y nunca los libera.
# ---------------------------------------------------------------------------
@app.route("/api/v1/process-data", methods=["POST"])
def process_data():
    """
    Simula el procesamiento de datos de producción. Cada llamada reserva N
    Megabytes en la lista global LEAK_BUCKETS, los "escribe" (touch de páginas)
    para forzar la materialización de pages y NUNCA los libera.

    Con el tiempo el proceso crece y dispara:
      - Reto 1: el OOM Killer (Exit Code 137).
    """
    mb = _extraer_mb(request, 50)
    n_bytes = mb * 1024 * 1024

    # bytearray garantiza resident set size real (páginas tocadas/escritas).
    bloque = bytearray(n_bytes)
    # Touch de todas las páginas para que el kernel materialice las páginas.
    for offset in range(0, n_bytes, 4096):
        bloque[offset] = 0xFF
    LEAK_BUCKETS.append(bloque)  # La referencia permanece para siempre (fuga).

    total = len(LEAK_BUCKETS) * mb
    return jsonify(
        {
            "result": "ok",
            "asignado_mb": mb,
            "bloques_acumulados": len(LEAK_BUCKETS),
            "total_fugado_mb": total,
            "pid": os.getpid(),
        }
    )


# ---------------------------------------------------------------------------
# 3. Reporte pesado: intenta reservar 350 MB de golpe en un buffer temporal.
# ---------------------------------------------------------------------------
@app.route("/api/v1/batch-report", methods=["GET"])
def batch_report():
    """
    Simula la generación de un reporte batch. Intenta reservar ~350 MB en un
    bytearray local (buffer temporal).

      - Reto 3 (límite 200m, sin swap): la reserva excede el límite del cgroup
        y se aborta con MemoryError casi instantáneamente.
      - Si el proceso ya tiene fugas acumuladas, el fallo es aún más abrupto.
    """
    global REPORT_BUFFER
    TARGET_MB = 350

    try:
        REPORT_BUFFER = bytearray(TARGET_MB * 1024 * 1024)
        # Touch de páginas para forzar paginación real.
        for offset in range(0, 35 * 1024 * 1024, 4096):  # ~350 MB / 4 KiB
            REPORT_BUFFER[offset] = 0x01
        return jsonify(
            {
                "result": "ok",
                "reporte_mb": TARGET_MB,
                "message": "Reporte generado correctamente",
                "pid": os.getpid(),
            }
        )
    except MemoryError:
        # Memoria insuficiente dentro del cgroup -> fallo estricto.
        return (
            jsonify(
                {
                    "result": "error",
                    "error": "MemoryError: no hay memoria suficiente en el cgroup",
                    "solicitado_mb": TARGET_MB,
                    "pid": os.getpid(),
                }
            ),
            500,
        )


# ---------------------------------------------------------------------------
# 4. Analíticas: carga 180 MB y los "procesa" con escrituras (paginación activa)
# ---------------------------------------------------------------------------
@app.route("/api/v1/analytics", methods=["GET"])
def analytics():
    """
    Simula un job de analítica que carga 180 MB y realiza iteraciones/escrituras
    sobre el buffer. Esto fuerza paginación activa (page faults y escritura de
    páginas), que unido a Swap lento produce Thrashing/hiperpaginación.

      - Reto 2 (límite 128m / swap 512m): el exceso va a Swap (kswapd activo,
        alta iowait, latencia extrema visible con vmstat).
    """
    global ANALYTICS_BUFFER
    TARGET_MB = 180
    n_bytes = TARGET_MB * 1024 * 1024

    try:
        ANALYTICS_BUFFER = bytearray(n_bytes)
        # Ciclo de "procesamiento": toca y reescribe cada página 3 veces,
        # haciendo CPU + memoria + paginación intensiva.
        for pasada in range(3):
            for offset in range(0, n_bytes, 4096):
                ANALYTICS_BUFFER[offset] = (offset >> 12) & 0xFF
        return jsonify(
            {
                "result": "ok",
                "analitica_mb": TARGET_MB,
                "pasadas": 3,
                "pid": os.getpid(),
                "memoria": _estado_memoria(),
            }
        )
    except MemoryError:
        return (
            jsonify(
                {
                    "result": "error",
                    "error": "MemoryError: buffer de analíticas demasiado grande para el cgroup",
                    "solicitado_mb": TARGET_MB,
                    "pid": os.getpid(),
                }
            ),
            500,
        )


# ---------------------------------------------------------------------------
# 5. Endpoint administrativo: libera las estructuras globales y fuerza GC.
# ---------------------------------------------------------------------------
@app.route("/admin/clear", methods=["POST"])
def admin_clear():
    """Permite a los estudiantes "desfogar" la fuga sin reiniciar el contenedor.
    Es la acción de remediación de primer nivel (mitigación)."""
    global LEAK_BUCKETS, REPORT_BUFFER, ANALYTICS_BUFFER, ANALYTICS_PAGES
    liberados = len(LEAK_BUCKETS)
    LEAK_BUCKETS = []          # Se sueltan todas las referencias de la fuga.
    REPORT_BUFFER = None
    ANALYTICS_BUFFER = None
    ANALYTICS_PAGES = []
    gc.collect()               # Recolección forzada para devolver memoria al allocator.
    return jsonify(
        {
            "result": "ok",
            "bloques_liberados": liberados,
            "gc_colecciones": gc.collect(),
            "pid": os.getpid(),
        }
    )


if __name__ == "__main__":
    # Servir en 0.0.0.0 para que el puerto del contenedor sea accesible.
    app.run(host="0.0.0.0", port=5000)