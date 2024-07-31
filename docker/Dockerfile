# Use the official Node.js 18 image.
# This sets the base image for your Docker container.
FROM node:18

# Create and change to the app directory.
# This sets the working directory inside the container.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install production dependencies.
# This installs only the production dependencies listed in package.json.
RUN npm install --only=production

# Copy local code to the container image.
# This copies the entire project directory into the container.
COPY . .

# Copy the .env file
# This ensures that your environment variables are available inside the container.
COPY src/config/.env ./src/config/.env

# Copy the database file
# This ensures that your SQLite database is available inside the container.
COPY src/database/database.sqlite ./src/database/database.sqlite

# Run the web service on container startup.
# This sets the command to run your bot when the container starts.
CMD [ "node", "src/bot.js" ]