# 1. Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Compilar Angular con SSR
RUN npm run build

# 2. Etapa de runtime
FROM node:18-alpine AS runtime
WORKDIR /app

# Copiar los archivos compilados desde la etapa de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Exponer el puerto (Dokploy usará este)
EXPOSE 3030

# Comando para iniciar SSR
CMD ["node", "dist/platform-upiiz-front/server/server.mjs"]