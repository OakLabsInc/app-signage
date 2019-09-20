FROM oaklabs/oak:5.0.9

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install --production && npm cache clean --force

COPY . /app

CMD ["/app"]

ENV API_KEY=r7eJvn9HIvMh25CWknMUFoNuW2d2 \
    GALLERY_NAME=showroom7