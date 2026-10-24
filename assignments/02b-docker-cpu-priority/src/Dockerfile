FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir flask
COPY app.py stress.py ./
EXPOSE 5000
# APP_NICE define la prioridad con la que arranca app.py
CMD ["sh", "-c", "exec nice -n ${APP_NICE} python app.py"]
