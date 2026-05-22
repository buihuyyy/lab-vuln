FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/data

EXPOSE 3000
ENV DB_PATH=/app/data/app.db

CMD ["node", "backend/server.js"]
