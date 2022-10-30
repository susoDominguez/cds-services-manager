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
ARG buildtime_TMR_HOST=tmrweb
ARG buildtime_MONGODB_CIG_MODEL=tmr
ARG buildtime_TMR_PORT=8888
ARG buildtime_TMR_CIGS_INTERACTIONS=guidelines/interactions
ARG buildtime_ARGUMENTATION_ENGINE_URL=aba-plus-g.herokuapp.com/generate_explanations

ENV MONGODB_HOST=${MONGODB_HOST:-$buildtime_MONGODB_HOST}
ENV MONGODB_PORT=${MONGODB_PORT:-$buildtime_MONGODB_PORT}
ENV LOGS=${LOGS:-$buildtime_LOGS}
ENV PORT=${PORT:-$buildtime_PORT}
ENV INTERACTION_HOST=${TMR_HOST:-$buildtime_TMR_HOST}
ENV MONGODB_TEMPLATES=${MONGODB_TEMPLATES:-$buildtime_MONGODB_TEMPLATES}
ENV MONGODB_CIG_MODEL=${MONGODB_CIG_MODEL:-$buildtime_MONGODB_CIG_MODEL}
ENV INTERACTION_PORT=${TMR_PORT:-$buildtime_TMR_PORT}
ENV TMR_CIGS_INTERACTIONS=${TMR_CIGS_INTERACTIONS:-$buildtime_TMR_CIGS_INTERACTIONS}
ENV ARGUMENTATION_ENGINE_URL=${ARGUMENTATION_ENGINE_URL:-$buildtime_ARGUMENTATION_ENGINE_URL}
ENV TMR_CIG_CREATE=guideline/create
ENV TMR_CIG_DELETE=guideline/delete
ENV TMR_CIG_ADD=guidelines/add
ENV TMR_CIG_GET=guidelines/cig/get
ENV INTERACTION_DB=tmrweb

RUN npm ci --only=production --omit=dev

COPY --chown=node:node . .

USER node

EXPOSE ${PORT}

HEALTHCHECK \
    --interval=10s \
    --timeout=5s \
    --start-period=10s \
    --retries=5 \
    CMD curl -f http://localhost/${PORT}/_health/ \
    || exit 1
CMD ["dumb-init", "node", "./bin/www"]