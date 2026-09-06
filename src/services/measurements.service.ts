import { PrismaClient, MeasurementType } from '@prisma/client'
import { CreateMeasurementInput, MeasurementQuery, UNITS } from '../schemas/measurements.schema.js'
import { assertMembership } from './children.service.js'

export async function createMeasurement(
  prisma: PrismaClient,
  userId: string,
  childId: string,
  input: CreateMeasurementInput,
) {
  await assertMembership(prisma, userId, childId)

  const unit = input.unit ?? UNITS[input.type]

  return prisma.measurement.create({
    data: {
      childId,
      recordedByUserId: userId,
      type: input.type,
      value: input.value,
      unit,
      date: new Date(input.date),
    },
    select: {
      id: true,
      type: true,
      value: true,
      unit: true,
      date: true,
      createdAt: true,
      recordedBy: { select: { id: true, name: true } },
    },
  })
}

export async function listMeasurements(
  prisma: PrismaClient,
  userId: string,
  childId: string,
  query: MeasurementQuery,
) {
  await assertMembership(prisma, userId, childId)

  const where: {
    childId: string
    type?: MeasurementType
    date?: { gte?: Date; lte?: Date }
  } = { childId }

  if (query.type) where.type = query.type

  if (query.from || query.to) {
    where.date = {}
    if (query.from) where.date.gte = new Date(query.from)
    if (query.to) where.date.lte = new Date(query.to)
  }

  return prisma.measurement.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      type: true,
      value: true,
      unit: true,
      date: true,
      createdAt: true,
      recordedBy: { select: { id: true, name: true } },
    },
  })
}

export async function deleteMeasurement(
  prisma: PrismaClient,
  userId: string,
  measurementId: string,
) {
  const measurement = await prisma.measurement.findUnique({
    where: { id: measurementId },
    select: { childId: true },
  })

  if (!measurement) {
    throw Object.assign(new Error('Medição não encontrada'), { statusCode: 404 })
  }

  await assertMembership(prisma, userId, measurement.childId)

  await prisma.measurement.delete({ where: { id: measurementId } })
}
