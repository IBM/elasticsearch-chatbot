---
version: '3.3'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.5.4
    container_name: elasticsearch

  app:
    container_name: elasticsearch-chatbot-app
    build: app
    ports:
      - "5000:5000"
    environment:
      - ELASTIC_BASE_URL=http://elasticsearch:9200
      - WATSON_VERSION=test
      - WATSON_USERNAME=test
      - WATSON_PASSWORD=test
      - WATSON_API_URL=test
      - WATSON_ASSISTANT_ID=test
    depends_on:
      - elasticsearch

  web:
    container_name: elasticsearch-chatbot-web
    build: web
    ports:
      - "3000:3000"
    depends_on:
      - app
