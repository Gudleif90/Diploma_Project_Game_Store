FROM node:26-alpine3.23

RUN addgroup app && adduser -S -G app app
USER app

WORKDIR /app
COPY package*.json .

USER root
RUN chown -R app:app .

USER app

RUN npm install



COPY . .
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]