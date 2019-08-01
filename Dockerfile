FROM node:10-alpine
ADD package*.json /tmp/
RUN cd /tmp && npm install
RUN mkdir -p /opt/app/bot && cp -a /tmp/node_modules /opt/app/bot
WORKDIR /opt/app/bot
ADD . /opt/app/bot
RUN cd /tmp && rm package*.json && rm -r node_modules
EXPOSE 3000
CMD ["node", "index.js"]