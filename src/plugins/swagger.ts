import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

const swaggerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'MeuFilho API',
        description: 'API de acompanhamento de gestação e desenvolvimento do bebê',
        version: '1.0.2',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
})

export default swaggerPlugin
