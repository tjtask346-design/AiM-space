FROM node:20-slim AS b
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
WORKDIR /a
RUN git clone --depth 1 --branch 1.3.1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git . && cd server && npm ci && npx tsc
FROM python:3.11-slim
RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=b /a/server /app/bgutil-server
COPY . .
RUN pip install fastapi uvicorn requests
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
