FROM node:alpine3.18
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
COPY scrapers ./
COPY helperFunctions ./
EXPOSE 3001
CMD [ "npm", "run", "start" ]