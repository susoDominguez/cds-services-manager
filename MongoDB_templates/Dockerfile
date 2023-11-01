FROM mongo:4.4.17
 # Will be set through Environment Files
 ARG buildarg_MONGODB_PORT=27017

 ENV URI=mongodb://mongodb:${MONGODB_PORT:-$buildarg_MONGODB_PORT}

 COPY ./MongoDB_templates/templates /templates

 CMD mongoimport  --uri=${URI}/tmr-db --collection=templates --drop --file=/templates