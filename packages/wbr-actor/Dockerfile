FROM node:16-alpine

WORKDIR /root

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV DOCKER=1

COPY wbr-actor.js /root/wbr-actor.js
COPY package.json ./package.json

ENV CHROMIUM_PATH /usr/bin/chromium-browser
RUN apk add --no-cache chromium 

RUN npm install .

ENTRYPOINT [ "npm", "start" ]