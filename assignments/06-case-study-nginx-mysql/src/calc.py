import math, sys

USUARIOS_PICO = 1200
CONEXIONES_USUARIO = 4
MARGEN_CONEXIONES = 1.5
COSTO_CONEXION_MB = 2.5

ESCENARIOS = {
    "A": dict(ram_gb=8, vcpu=4, oh_nativo=0.125, oh_docker=0.25, nginx_nativo_gb=0.30,
              nginx_docker_gb=1.0, nginx_cpu=1.5, max_conn=200, margen_mb=300),
    "B": dict(ram_gb=4, vcpu=2, oh_nativo=0.15, oh_docker=0.25, nginx_nativo_gb=0.25,
              nginx_docker_gb=0.5, nginx_cpu=0.5, max_conn=100, margen_mb=250),
}


def conexiones(workers):
    return int(USUARIOS_PICO * CONEXIONES_USUARIO * MARGEN_CONEXIONES + workers)


def calcular(e):
    ram_mb = e["ram_gb"] * 1024
    conn_mb = e["max_conn"] * COSTO_CONEXION_MB
    r = {}
    so = ram_mb * e["oh_nativo"]
    cache = ram_mb - so - e["nginx_nativo_gb"] * 1024 - conn_mb
    r["nativo"] = dict(overhead_gb=so / 1024, libre_gb=(ram_mb - so) / 1024, workers=e["vcpu"],
                       conn_proceso=conexiones(e["vcpu"]), conn_mb=conn_mb, cache_mb=cache,
                       buffer_pool_mb=cache - e["margen_mb"])
    so = ram_mb * e["oh_docker"]
    mysql_mb = ram_mb - so - e["nginx_docker_gb"] * 1024
    cache = mysql_mb - conn_mb
    w = math.ceil(e["nginx_cpu"])
    r["docker"] = dict(overhead_gb=so / 1024, libre_gb=(ram_mb - so) / 1024, nginx_gb=e["nginx_docker_gb"],
                       mysql_gb=mysql_mb / 1024, mysql_mb=mysql_mb, cpu_nginx=e["nginx_cpu"],
                       cpu_mysql=e["vcpu"] - e["nginx_cpu"], workers=w, conn_proceso=conexiones(w),
                       conn_mb=conn_mb, cache_mb=cache, buffer_pool_mb=cache - e["margen_mb"])
    return r


def imprimir(nombre):
    e = ESCENARIOS[nombre]
    r = calcular(e)
    n, d = r["nativo"], r["docker"]
    print("ESCENARIO %s: %d GB RAM, %d vCPU, max_connections=%d, margen=%d MB" % (nombre, e["ram_gb"], e["vcpu"], e["max_conn"], e["margen_mb"]))
    print("-" * 78)
    print("%-44s %15s %15s" % ("Parametro", "Nativo", "Docker"))
    print("%-44s %15.3f %15.3f" % ("Overhead SO / Docker (GB)", n["overhead_gb"], d["overhead_gb"]))
    print("%-44s %15.3f %15.3f" % ("RAM libre para servicios (GB)", n["libre_gb"], d["libre_gb"]))
    print("%-44s %15s %15.3f" % ("mem_limit Nginx (GB)", "N/A", d["nginx_gb"]))
    print("%-44s %15s %15.3f" % ("mem_limit MySQL (GB)", "N/A", d["mysql_gb"]))
    print("%-44s %15s %15.1f" % ("vCPUs Nginx", "compartidas (%d)" % e["vcpu"], d["cpu_nginx"]))
    print("%-44s %15s %15.1f" % ("vCPUs MySQL", "compartidas (%d)" % e["vcpu"], d["cpu_mysql"]))
    print("%-44s %15d %15d" % ("procesos_trabajadores (worker_processes)", n["workers"], d["workers"]))
    print("%-44s %15d %15d" % ("conexiones_por_proceso (worker_connections)", n["conn_proceso"], d["conn_proceso"]))
    print("%-44s %15.1f %15.1f" % ("conexiones_max x costo_por_conexion (MB)", n["conn_mb"], d["conn_mb"]))
    print("%-44s %15.1f %15.1f" % ("memoria_cache (MB)", n["cache_mb"], d["cache_mb"]))
    print("%-44s %15.1f %15.1f" % ("memoria_cache - margen = buffer pool (MB)", n["buffer_pool_mb"], d["buffer_pool_mb"]))
    print("%-44s %15.2f %15.2f" % ("buffer pool (GB)", n["buffer_pool_mb"] / 1024, d["buffer_pool_mb"] / 1024))


if __name__ == "__main__":
    for nombre in sys.argv[1:] or ["A", "B"]:
        imprimir(nombre)
        print()
