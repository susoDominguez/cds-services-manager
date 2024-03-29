# syntax=docker/dockerfile:1
#Node Base image
FROM node:16.17.0-alpine
LABEL org.opencontainers.image.authors="jesus.dominguez@kcl.ac.uk"
#run a simple process supervisor and init system designed to run as PID 1 inside minimal container environments
RUN apk add dumb-init
#defining production environment variable
ENV NODE_ENV=production
#create directory
#RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

ARG buildtime_MONGODB_HOST=127.0.0.1
ARG buildtime_MONGODB_PORT=2710
ARG buildtime_LOGS=cds_sm_logs
ARG buildtime_PORT=3010
ARG buildtime_MONGODB_TEMPLATES=templates 
ARG buildtime_INTERACTION_HOST=interaction_service
ARG buildtime_INTERACTION_DB=tmrweb
ARG buildtime_MONGODB_CIG_MODEL=tmr
ARG buildtime_TMR_PORT=8888
ARG buildtime_ARGUMENTATION_PORT=5000
ARG buildtime_ARGUMENTATION_HOST=localhost

ENV MONGODB_HOST=${MONGODB_HOST:-$buildtime_MONGODB_HOST}
ENV MONGODB_PORT=${MONGODB_PORT:-$buildtime_MONGODB_PORT}
ENV ARGUMENTATION_PORT=${ARGUMENTATION_PORT:-$buildtime_ARGUMENTATION_PORT}
ENV ARGUMENTATION_HOST=${ARGUMENTATION_HOST:-$buildtime_ARGUMENTATION_HOST}
ENV LOGS=${LOGS:-$buildtime_LOGS}
ENV PORT=${PORT:-$buildtime_PORT}
ENV INTERACTION_HOST=${INTERACTION_HOST:-$buildtime_INTERACTION_HOST}
ENV MONGODB_TEMPLATES=${MONGODB_TEMPLATES:-$buildtime_MONGODB_TEMPLATES}
ENV MONGODB_CIG_MODEL=${MONGODB_CIG_MODEL:-$buildtime_MONGODB_CIG_MODEL}
ENV INTERACTION_PORT=${INTERACTION_PORT:-$buildtime_TMR_PORT}
ENV TMR_CIG_CREATE=guideline/create
ENV TMR_CIG_DELETE=guideline/delete
ENV TMR_CIG_ADD=guidelines/add
ENV TMR_CIG_GET=guidelines/cig/get
ENV TMR_CIGS_INTERACTIONS=guidelines/interactions
ENV INTERACTION_DB=${INTERACTION_DB:-${buildtime_INTERACTION_DB}}

RUN npm ci --only=production --omit=dev

COPY --chown=node:node . .

USER node

HEALTHCHECK \
    --interval=10s \
    --timeout=5s \
    --start-period=10s \
    --retries=5 \
    CMD curl -f http://127.0.0.1:${PORT}/_health/ \
    || exit 1


EXPOSE ${PORT}

CMD ["dumb-init", "node", "./bin/www"]