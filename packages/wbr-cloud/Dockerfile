# WBR-cloud Dockerfile

###################
#     BUILDER     #
###################

FROM node:16-alpine as wbr-cloud-build

WORKDIR /root

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

RUN mkdir -p -- ./node_modules/@wbr/wbr-common

COPY "src" "./src"
COPY "package.json" "./package.json"
COPY "tsconfig.json" "./tsconfig.json"

RUN npm i .
RUN npm i -g typescript
RUN npm run compile

###################
#      FINAL      #
###################

FROM node:16-alpine as wbr-cloud

EXPOSE 3000/tcp

ENV DOCKER 1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

WORKDIR /root

COPY --from=wbr-cloud-build /root/build build
COPY --from=wbr-cloud-build /root/package.json package.json
# this makes me a little nauseous, but it works, why would we install the packages twice, right?
COPY --from=wbr-cloud-build /root/node_modules /root/node_modules

RUN mkdir uploads
COPY "examples" "uploads"

RUN mkdir public
COPY "public" "public"

ENTRYPOINT ["npm", "start"]