#!/bin/sh
set -e

MONGO_HOST="${ME_CONFIG_MONGODB_SERVER:-mongo}"
MONGO_PORT="${ME_CONFIG_MONGODB_PORT:-27017}"
MAX_RETRIES=10
SLEEP_SECONDS=2

echo "Waiting for Mongo ($MONGO_HOST:$MONGO_PORT) to become available..."

attempt=1
while [ $attempt -le $MAX_RETRIES ]
do

  if nc -z "$MONGO_HOST" "$MONGO_PORT" >/dev/null 2>&1; then
    echo "Mongo is available! (attempt $attempt)"
    break
  else
    echo "Mongo not ready (attempt $attempt/$MAX_RETRIES). Retrying in $SLEEP_SECONDS s..."
    sleep $SLEEP_SECONDS
  fi
  attempt=$((attempt+1))
done

if [ $attempt -gt $MAX_RETRIES ]; then
  echo "Error: Mongo not reachable after $MAX_RETRIES attempts."
fi

echo "Starting mongo-express on port $PORT..."

exec node app.js
