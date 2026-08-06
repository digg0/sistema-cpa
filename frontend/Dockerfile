
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

Servir os arquivos compilados com o Nginx
FROM nginx:alpine


COPY --from=build /app/dist /usr/share/nginx/html

# Copia as configurações do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]