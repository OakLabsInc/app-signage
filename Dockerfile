FROM oaklabs/oak:4.2.0

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i --engine-strict=true --progress=false --loglevel="error" \
    && npm cache clean --force \
    && mkdir /data \
    && echo "{}" > /data/settings.json

COPY src .

CMD ["/app"]

VOLUME /data

EXPOSE 9999

ENV NODE_TLS_REJECT_UNAUTHORIZED=0 \
    NODE_ENV=production \
    SETTINGS_FILE=assets/settings.json
