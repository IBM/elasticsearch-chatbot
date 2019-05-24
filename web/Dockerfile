FROM node:10-alpine
MAINTAINER Max Shapiro "maxshapiro32@ibm.com"
COPY . /web
WORKDIR /web
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
