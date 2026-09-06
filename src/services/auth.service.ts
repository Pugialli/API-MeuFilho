import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { FastifyInstance } from 'fastify'
import { SignupInput, LoginInput } from '../schemas/auth.schema.js'

const REFRESH_EXPIRES_DAYS = 7

export async function signupUser(prisma: PrismaClient, input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw Object.assign(new Error('Email já cadastrado'), { statusCode: 409 })
  }

  const passwordHash = await argon2.hash(input.password)

  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}

export async function loginUser(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  input: LoginInput,
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
  }

  const valid = await argon2.verify(user.passwordHash, input.password)
  if (!valid) {
    throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 })
  }

  const payload = { sub: user.id, email: user.email }

  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  } as Parameters<typeof fastify.jwt.sign>[1])

  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'],
  })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS)

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  })

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

export async function refreshAccessToken(
  prisma: PrismaClient,
  fastify: FastifyInstance,
  token: string,
) {
  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload
  } catch {
    throw Object.assign(new Error('Refresh token inválido ou expirado'), { statusCode: 401 })
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token inválido ou expirado'), { statusCode: 401 })
  }

  const accessToken = fastify.jwt.sign(
    { sub: payload.sub!, email: payload.email as string },
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' } as Parameters<typeof fastify.jwt.sign>[1],
  )

  return { accessToken }
}
