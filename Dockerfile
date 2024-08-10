# Stage 1: Install dependencies
FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Stage 2: Copy source and build
FROM node:20
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
ENV BOT_TOKEN=$BOT_TOKEN
ENV CLIENT_ID=$CLIENT_ID
ENV GUILD_ID=$GUILD_ID
ENV ADMIN_ID=$ADMIN_ID
ENV DATABASE_URL=$DATABASE_URL
ENV PIN_SERVER=$PIN_SERVER
ENV PIN_CHANNEL=$PIN_CHANNEL
ENV LASTFM_KEY=$LASTFM_KEY
ENV LASTFM_SECRET=$LASTFM_SECRET
ENV REBRICK_KEY=$REBRICK_KEY
ENV CAT_KEY=$CAT_KEY
ENV NASA_KEY=$NASA_KEY
CMD ["npm", "start_and_deploy"]