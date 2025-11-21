# ./django/Dockerfile
FROM --platform=$BUILDPLATFORM python:3.12-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

ARG TARGETARCH
ARG TOOLS_VER=100.13.0

RUN set -eux; \
    apt-get update && apt-get install -y --no-install-recommends curl ca-certificates tar xz-utils && rm -rf /var/lib/apt/lists/*; \
    case "$TARGETARCH" in \
      amd64)  MARCH=amd64 ;; \
      arm64)  MARCH=arm64 ;; \
      *) echo "Unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
    esac; \
    BASE_URL="https://fastdl.mongodb.org/tools/db"; \
    for DIST in ubuntu2204 debian11 ubuntu2004; do \
      URL="$BASE_URL/mongodb-database-tools-${DIST}-${MARCH}-${TOOLS_VER}.tgz"; \
      echo "Trying $URL"; \
      if curl -fSL "$URL" -o /tmp/tools.tgz; then echo "Downloaded $URL"; break; fi; \
    done; \
    [ -s /tmp/tools.tgz ] || (echo "No se pudo descargar mongodb-database-tools para $MARCH" && exit 1); \
    tar -xzf /tmp/tools.tgz -C /tmp; \
    mv /tmp/mongodb-database-tools-*/bin/* /usr/local/bin/; \
    rm -rf /tmp/tools.tgz /tmp/mongodb-database-tools-*; \
    apt-get purge -y tar xz-utils || true; apt-get autoremove -y || true

COPY requirements.txt ./
RUN set -eux; pip install --upgrade pip && pip install --no-cache-dir gunicorn uvicorn && pip install --no-cache-dir -r requirements.txt

COPY . /app/
RUN mkdir -p /tmp/mongo_backup

EXPOSE 8000

CMD ["sh", "-c", "python manage.py makemigrations --no-input && \
                  python manage.py migrate --no-input && \
                  python manage.py collectstatic --no-input && \
                  python init_scripts.py && \
                  python manage.py sync_scripts && \
                  celery -A system_installation_project worker --loglevel=info -E & \
                  celery -A system_installation_project beat --loglevel=info & \
                  gunicorn system_installation_project.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"]
