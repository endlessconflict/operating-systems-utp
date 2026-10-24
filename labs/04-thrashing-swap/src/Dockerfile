# -----------------------------------------------------------------------------
# Dockerfile - Microservicio de producción vulnerable (laboratorio de memoria)
# Imagen base mínima y liviana para Python 3.11.
# -----------------------------------------------------------------------------
FROM python:3.11-slim

# Metadata del servicio (buena práctica de producción).
LABEL maintainer="Laboratorio S.O. 4to Anio"
LABEL description="Lab 2 - Thrashing/Swap | Microservicio vulnerable con fallas intencionadas de memoria"

# No escribir archivos .pyc ni almacenar en búfer la salida (logs en vivo).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Directorio de trabajo de la aplicación.
WORKDIR /app

# Copiar la aplicación (solo app.py por simplicidad del laboratorio).
COPY app.py .

# Instalar dependencias con caché deshabilitada para reducir el tamaño de capa.
RUN pip install --no-cache-dir flask

# Puerto expuesto por el microservicio.
EXPOSE 5000

# Comando por defecto: arranca la app Flask en 0.0.0.0:5000.
CMD ["python", "app.py"]