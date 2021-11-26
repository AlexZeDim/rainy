FROM node:17.1-alpine3.12 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn add glob rimraf webpack

RUN yarn --only=development

COPY . .

RUN yarn run build NODE_OPTIONS=--openssl-legacy-provider

FROM node:17.1-alpine3.12 as production

ARG NODE_ENV=production
ARG NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]



