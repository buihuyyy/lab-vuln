FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN node backend/seed.js

EXPOSE 3000

CMD ["node", "backend/server.js"]
