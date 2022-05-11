# WBR-cloud Dockerfile

###################
#     BUILDER     #
###################

FROM node:17-alpine as editor-build

WORKDIR /root

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1

RUN apk add g++ make python3

COPY "./" "./"

RUN npm run confBuildDeps

RUN apk add git

RUN npm run build

###################
#      FINAL      #
###################

FROM node:17-alpine as wbr-editor

EXPOSE 8080/tcp

ENV DOCKER 1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

WORKDIR /root

COPY --from=editor-build /root/packages/wbr-interpret ./packages/wbr-interpret
COPY --from=editor-build /root/packages/wbr-cloud ./packages/wbr-cloud

WORKDIR /root/packages/wbr-cloud

RUN npm install

ENTRYPOINT ["npm", "start"]