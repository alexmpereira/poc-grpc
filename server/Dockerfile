FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY server.js ./
# We will mount the proto folder via volume or copy it in docker-compose context

CMD ["npm", "start"]
