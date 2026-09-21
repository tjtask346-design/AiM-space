FROM node:20-slim AS bgutil-builder
WORKDIR /app
RUN git clone --depth 1 --branch 1.3.1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git .
WORKDIR /app/server
RUN npm ci && npx tsc

FROM python:3.11-slim
RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=bgutil-builder /app/server /app/bgutil-server
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
