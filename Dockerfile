# WBR-cloud Dockerfile

###################
#     BUILDER     #
###################

FROM node:16-alpine as build-stage

WORKDIR /root

RUN mkdir packages
COPY "packages" "./packages"

COPY "lerna.json" "./lerna.json"
COPY "package.json" "./package.json"

RUN npm install -g lerna
RUN npx lerna bootstrap --hoist 
RUN npx lerna run build-interpret
RUN npx lerna run build-cloud

###################
#      FINAL      #
###################

FROM node:16-alpine as result

EXPOSE 3000/tcp

ENV DOCKER 1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

WORKDIR /root

COPY --from=build-stage /root/packages/wbr-cloud /root/wbr-cloud
COPY --from=build-stage /root/packages/wbr-interpret /root/wbr-interpret

RUN mkdir /root/wbr-cloud/uploads
COPY "./examples/." "/root/wbr-cloud/uploads"

WORKDIR /root/wbr-cloud/

RUN npm install .

ENTRYPOINT ["npm", "start"]