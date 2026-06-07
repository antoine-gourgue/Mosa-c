FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json ./
COPY realtime ./realtime

ENV NODE_ENV=production
EXPOSE 4001

CMD ["npx", "tsx", "realtime/index.ts"]
