FROM node:16-alpine

WORKDIR /root

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY wbr-actor.js /root/wbr-actor.js
COPY package.json ./package.json

RUN npm install .

ENTRYPOINT [ "npm", "start" ]