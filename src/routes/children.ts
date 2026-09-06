import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createChildSchema,
  joinChildSchema,
  childParamsSchema,
} from '../schemas/children.schema.js'
import { createChild, joinChild, listChildren } from '../services/children.service.js'

const childrenRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.post('/', { schema: { body: createChildSchema } }, async (request, reply) => {
    const child = await createChild(fastify.prisma, request.user.sub, request.body)
    return reply.status(201).send({ data: child })
  })

  fastify.post(
    '/join',
    { schema: { body: joinChildSchema } },
    async (request, reply) => {
      const child = await joinChild(fastify.prisma, request.user.sub, request.body.inviteCode)
      return reply.send({ data: child })
    },
  )

  fastify.get('/', async (request, reply) => {
    const children = await listChildren(fastify.prisma, request.user.sub)
    return reply.send({ data: children })
  })
}

export default childrenRoutes
