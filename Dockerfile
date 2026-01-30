FROM node:20
WORKDIR /app
COPY package*.json ./
# Copiamos la carpeta prisma primero para que esté disponible durante el install
COPY prisma ./prisma/ 
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "app.js"]