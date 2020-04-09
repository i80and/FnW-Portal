FROM node:12.13.0

ARG NODE_APP_DIR

WORKDIR /opt/app/

ADD ./ /opt/app/

RUN npm install pm2 -g
RUN npm install
RUN npm run-script build

EXPOSE 3000
CMD [ "pm2-runtime", "src/server.js" ]
