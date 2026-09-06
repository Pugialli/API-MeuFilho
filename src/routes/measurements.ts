import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createMeasurementSchema,
  measurementParamsSchema,
  measurementIdParamsSchema,
  measurementQuerySchema,
} from '../schemas/measurements.schema.js'
import {
  createMeasurement,
  listMeasurements,
  deleteMeasurement,
} from '../services/measurements.service.js'

const measurementRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.post(
    '/children/:childId/measurements',
    {
      schema: {
        tags: ['Medições'],
        summary: 'Registrar medição (WEIGHT, HEIGHT ou BPM)',
        security: [{ bearerAuth: [] }],
        params: measurementParamsSchema,
        body: createMeasurementSchema,
      },
    },
    async (request, reply) => {
      const measurement = await createMeasurement(
        fastify.prisma,
        request.user.sub,
        request.params.childId,
        request.body,
      )
      return reply.status(201).send({ data: measurement })
    },
  )

  fastify.get(
    '/children/:childId/measurements',
    {
      schema: {
        tags: ['Medições'],
        summary: 'Listar medições — filtros opcionais: type, from, to (YYYY-MM-DD)',
        security: [{ bearerAuth: [] }],
        params: measurementParamsSchema,
        querystring: measurementQuerySchema,
      },
    },
    async (request, reply) => {
      const measurements = await listMeasurements(
        fastify.prisma,
        request.user.sub,
        request.params.childId,
        request.query,
      )
      return reply.send({ data: measurements })
    },
  )

  fastify.delete(
    '/measurements/:id',
    {
      schema: {
        tags: ['Medições'],
        summary: 'Deletar medição',
        security: [{ bearerAuth: [] }],
        params: measurementIdParamsSchema,
      },
    },
    async (request, reply) => {
      await deleteMeasurement(fastify.prisma, request.user.sub, request.params.id)
      return reply.status(204).send()
    },
  )
}

export default measurementRoutes
