FROM node:22-alpine
WORKDIR /app
COPY package.json server.js ./
COPY scanner ./scanner
COPY public ./public
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:${PORT}/healthz || exit 1
CMD ["node", "server.js"]
