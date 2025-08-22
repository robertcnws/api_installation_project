# ./django/Dockerfile
FROM python:3.12

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install uvicorn
RUN pip install -r requirements.txt

# ------- MongoDB tools (keyring + repo soportado) -------
RUN apt-get update && apt-get install -y wget curl ca-certificates gnupg lsb-release && \
    rm -rf /var/lib/apt/lists/*

RUN install -d -m 0755 /etc/apt/keyrings && \
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /etc/apt/keyrings/mongodb-server-7.0.gpg

RUN echo "deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
    | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

RUN apt-get update && apt-get install -y mongodb-database-tools && \
    rm -rf /var/lib/apt/lists/*
# --------------------------------------------------------

RUN mkdir -p /tmp/mongo_backup

COPY . /app/

EXPOSE 8000

CMD ["sh", "-c", "python manage.py makemigrations --no-input && \
                  python manage.py migrate --no-input && \
                  python manage.py collectstatic --no-input && \
                  python init_scripts.py && \
                  python manage.py sync_scripts && \
                  celery -A system_installation_project worker --loglevel=info -E & \
                  celery -A system_installation_project beat --loglevel=info & \
                  gunicorn system_installation_project.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"]
