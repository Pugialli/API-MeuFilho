import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createChildSchema,
  joinChildSchema,
} from '../schemas/children.schema.js'
import { createChild, joinChild, listChildren } from '../services/children.service.js'

const childrenRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.post(
    '/',
    {
      schema: {
        tags: ['Filhos'],
        summary: 'Criar filho — gera inviteCode automaticamente',
        security: [{ bearerAuth: [] }],
        body: createChildSchema,
      },
    },
    async (request, reply) => {
      const child = await createChild(fastify.prisma, request.user.sub, request.body)
      return reply.status(201).send({ data: child })
    },
  )

  fastify.post(
    '/join',
    {
      schema: {
        tags: ['Filhos'],
        summary: 'Entrar como responsável usando código de convite',
        security: [{ bearerAuth: [] }],
        body: joinChildSchema,
      },
    },
    async (request, reply) => {
      const child = await joinChild(fastify.prisma, request.user.sub, request.body.inviteCode)
      return reply.send({ data: child })
    },
  )

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Filhos'],
        summary: 'Listar filhos do usuário autenticado',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const children = await listChildren(fastify.prisma, request.user.sub)
      return reply.send({ data: children })
    },
  )
}

export default childrenRoutes
