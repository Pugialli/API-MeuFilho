import 'dotenv/config'
import type { IncomingMessage, ServerResponse } from 'node:http'
import Fastify, { FastifyError } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import fastifyCors from '@fastify/cors'
import prismaPlugin from '../src/plugins/prisma.js'
import authPlugin from '../src/plugins/auth.js'
import swaggerPlugin from '../src/plugins/swagger.js'
import authRoutes from '../src/routes/auth.js'
import childrenRoutes from '../src/routes/children.js'
import measurementRoutes from '../src/routes/measurements.js'

async function buildApp() {
  const fastify = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>()

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: 'Validation Error',
        message: 'Dados inválidos',
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    const fe = error as FastifyError
    const status = fe.statusCode ?? 500
    return reply.status(status).send({
      error: status >= 500 ? 'Internal Server Error' : fe.message,
      message: status >= 500 ? 'Erro interno do servidor' : fe.message,
    })
  })

  await fastify.register(fastifyCors, { origin: true })
  await fastify.register(prismaPlugin)
  await fastify.register(authPlugin)
  await fastify.register(swaggerPlugin)
  await fastify.register(authRoutes)
  await fastify.register(childrenRoutes, { prefix: '/children' })
  await fastify.register(measurementRoutes)

  return fastify
}

let appPromise: ReturnType<typeof buildApp> | null = null

function getApp() {
  if (!appPromise) appPromise = buildApp()
  return appPromise
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp()
  await app.ready()
  app.server.emit('request', req, res)
}
