import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { signupSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js'
import { signupUser, loginUser, refreshAccessToken } from '../services/auth.service.js'

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post('/auth/signup', { schema: { body: signupSchema } }, async (request, reply) => {
    const user = await signupUser(fastify.prisma, request.body)
    return reply.status(201).send({ data: user })
  })

  fastify.post('/auth/login', { schema: { body: loginSchema } }, async (request, reply) => {
    const result = await loginUser(fastify.prisma, fastify, request.body)
    return reply.send({ data: result })
  })

  fastify.post('/auth/refresh', { schema: { body: refreshSchema } }, async (request, reply) => {
    const result = await refreshAccessToken(fastify.prisma, fastify, request.body.refreshToken)
    return reply.send({ data: result })
  })
}

export default authRoutes
