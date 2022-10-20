# syntax=docker/dockerfile:1
#Node Base image
FROM node:16.17.0-alpine
#run a simple process supervisor and init system designed to run as PID 1 inside minimal container environments
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
#RUN apk add dumb-init
#defining production environment variable
ENV NODE_ENV=production
#create directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
ARG buildtime_MONGODB_HOST=127.0.0.1
ARG buildtime_MONGODB_PORT=2710
ARG buildtime_MONGODB_LOGS=cds_services
ARG buildtime_SERVICES_PORT=3010
ARG buildtime_TEMPLATES_COLLECTION=templates
ARG buildtime_MONGODB_CIG_MODEL=tmr
ENV MONGODB_HOST=${MONGODB_HOST:-$buildtime_MONGODB_HOST}
ENV MONGODB_PORT=${MONGODB_PORT:-$buildtime_MONGODB_PORT}
ENV MONGODB_LOGS=${MONGODB_LOGS:-$buildtime_MONGODB_LOGS}
ENV SERVICES_PORT=${SERVICES_PORT:-$buildtime_SERVICES_PORT}
ENV TEMPLATES_COLLECTION=${TEMPLATES_COLLECTION:-$buildtime_TEMPLATES_COLLECTION}
ENV MONGODB_CIG_MODEL=${MONGODB_CIG_MODEL:-$buildtime_MONGODB_CIG_MODEL}
COPY --chown=node:node . .
USER node
EXPOSE ${SERVICES_PORT}
RUN npm ci --only=production
HEALTHCHECK \
    --interval=10s \
    --timeout=5s \
    --start-period=10s \
    --retries=5 \
    CMD curl ${MONGODB_HOST}:${MONGODB_PORT}/_health/ \
    || exit 1
CMD ["dumb-init", "node", "./bin/www"]