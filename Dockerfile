# PWWW Dockerfile

FROM node:16-alpine

# the EXPOSE directive is just a documentation of the actors used ports. On the Apify platform, it utilizes APIFY_CONTAINER_PORT for the Liveview functionality.
EXPOSE 3000/tcp

ENV DOCKER 1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

WORKDIR /root

RUN mkdir wbr-cloud
COPY "wbr-cloud" "./wbr-cloud/"
RUN mkdir wbr-interpret
COPY "wbr-interpret" "./wbr-interpret"
COPY "package.json" "./package.json"

RUN npm run build

ENTRYPOINT ["npm", "start"]