FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "backend/server.js"]
