# Frontend Dockerfile per Bennati Home
FROM node:18-alpine as builder

# Imposta directory di lavoro
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci

# Copia il resto del codice
COPY . .

# Build dell'applicazione
RUN npm run build

# Stage 2: Nginx per servire il frontend
FROM nginx:alpine

# Copia il build dal builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configurazione nginx personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

