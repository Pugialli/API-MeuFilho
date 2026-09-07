import { buildApp } from './app.js'

async function bootstrap() {
  const fastify = await buildApp()
  const port = Number(process.env.PORT ?? 3000)
  await fastify.listen({ port, host: '0.0.0.0' })
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
