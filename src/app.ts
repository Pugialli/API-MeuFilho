import 'dotenv/config'
import Fastify, { FastifyError } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import fastifyCors from '@fastify/cors'

import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'
import swaggerPlugin from './plugins/swagger.js'
import authRoutes from './routes/auth.js'
import childrenRoutes from './routes/children.js'
import measurementRoutes from './routes/measurements.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>()

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
    fastify.log.error(fe)

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
