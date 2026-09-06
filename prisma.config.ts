import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import('@prisma/adapter-neon')
      const { neonConfig } = await import('@neondatabase/serverless')
      const { WebSocket } = await import('ws')

      neonConfig.webSocketConstructor = WebSocket

      return new PrismaNeon({
        connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
      })
    },
  },
})
