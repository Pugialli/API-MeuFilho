import { PrismaClient } from '@prisma/client'
import { customAlphabet } from 'nanoid'
import { CreateChildInput } from '../schemas/children.schema.js'

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export async function createChild(prisma: PrismaClient, userId: string, input: CreateChildInput) {
  const inviteCode = generateCode()

  return prisma.child.create({
    data: {
      name: input.name,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      inviteCode,
      memberships: {
        create: { userId, joinedAt: new Date() },
      },
    },
    select: {
      id: true,
      name: true,
      dueDate: true,
      inviteCode: true,
      createdAt: true,
    },
  })
}

export async function joinChild(prisma: PrismaClient, userId: string, inviteCode: string) {
  const child = await prisma.child.findUnique({ where: { inviteCode } })
  if (!child) {
    throw Object.assign(new Error('Código de convite inválido'), { statusCode: 404 })
  }

  const existing = await prisma.childMembership.findUnique({
    where: { userId_childId: { userId, childId: child.id } },
  })
  if (existing) {
    throw Object.assign(new Error('Você já é responsável por este filho'), { statusCode: 409 })
  }

  await prisma.childMembership.create({ data: { userId, childId: child.id } })

  return { id: child.id, name: child.name, dueDate: child.dueDate, inviteCode: child.inviteCode }
}

export async function listChildren(prisma: PrismaClient, userId: string) {
  const memberships = await prisma.childMembership.findMany({
    where: { userId },
    include: {
      child: {
        select: {
          id: true,
          name: true,
          dueDate: true,
          inviteCode: true,
          createdAt: true,
          memberships: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map(({ child }) => ({
    ...child,
    members: child.memberships.map((m) => ({ ...m.user, joinedAt: m.joinedAt })),
    memberships: undefined,
  }))
}

export async function assertMembership(prisma: PrismaClient, userId: string, childId: string) {
  const membership = await prisma.childMembership.findUnique({
    where: { userId_childId: { userId, childId } },
  })
  if (!membership) {
    throw Object.assign(new Error('Acesso negado a este filho'), { statusCode: 403 })
  }
}
