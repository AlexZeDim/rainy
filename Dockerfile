FROM node:16.9-alpine3.11 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install glob rimraf webpack

RUN yarn install --only=development

COPY . .

RUN yarn run build

FROM node:16.9-alpine3.11 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]



