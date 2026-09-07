import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../src/app.js'

// Reutiliza a instância entre invocações na mesma função serverless (warm starts)
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
