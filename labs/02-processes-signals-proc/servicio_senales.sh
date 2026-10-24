#!/bin/bash
# Captura de SIGINT y SIGTERM
trap 'echo "[!] Petición de terminación interceptada e ignorada."' SIGINT SIGTERM

echo "Servicio de pruebas iniciado. PID de este proceso: $$"
while true; do
    sleep 2
done
