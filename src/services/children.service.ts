import { PrismaClient } from '@prisma/client'
import { customAlphabet } from 'nanoid'
import { CreateChildInput, UpdateChildInput } from '../schemas/children.schema.js'

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

const childSelect = {
  id: true,
  name: true,
  dueDate: true,
  sex: true,
  inviteCode: true,
  createdAt: true,
} as const

export async function createChild(prisma: PrismaClient, userId: string, input: CreateChildInput) {
  const inviteCode = generateCode()

  return prisma.child.create({
    data: {
      name: input.name,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      sex: input.sex,
      inviteCode,
      memberships: {
        create: { userId, joinedAt: new Date() },
      },
    },
    select: childSelect,
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

  return prisma.child.findUniqueOrThrow({
    where: { id: child.id },
    select: childSelect,
  })
}

export async function listChildren(prisma: PrismaClient, userId: string) {
  const memberships = await prisma.childMembership.findMany({
    where: { userId },
    include: {
      child: {
        select: {
          ...childSelect,
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

export async function getChild(prisma: PrismaClient, userId: string, childId: string) {
  await assertMembership(prisma, userId, childId)

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      ...childSelect,
      memberships: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  })

  if (!child) {
    throw Object.assign(new Error('Filho não encontrado'), { statusCode: 404 })
  }

  const { memberships, ...rest } = child
  return {
    ...rest,
    members: memberships.map((m) => ({ ...m.user, joinedAt: m.joinedAt })),
  }
}

export async function updateChild(
  prisma: PrismaClient,
  userId: string,
  childId: string,
  input: UpdateChildInput,
) {
  await assertMembership(prisma, userId, childId)

  return prisma.child.update({
    where: { id: childId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.dueDate !== undefined && { dueDate: new Date(input.dueDate) }),
      ...(input.sex !== undefined && { sex: input.sex }),
    },
    select: childSelect,
  })
}

export async function assertMembership(prisma: PrismaClient, userId: string, childId: string) {
  const membership = await prisma.childMembership.findUnique({
    where: { userId_childId: { userId, childId } },
  })
  if (!membership) {
    throw Object.assign(new Error('Acesso negado a este filho'), { statusCode: 403 })
  }
}
