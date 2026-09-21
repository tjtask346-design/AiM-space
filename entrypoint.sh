#!/bin/sh
node /app/bgutil-server/build/main.js --port 4416 &
uvicorn main:app --host 0.0.0.0 --port $PORT
