import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import WebSocket from 'ws'
import argon2 from 'argon2'
import { customAlphabet } from 'nanoid'

neonConfig.webSocketConstructor = WebSocket as unknown as typeof globalThis.WebSocket

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

async function main() {
  console.log('Seeding database...')

  const passwordHash = await argon2.hash('senha123')

  const mae = await prisma.user.upsert({
    where: { email: 'mae@exemplo.com' },
    update: {},
    create: { name: 'Ana Lima', email: 'mae@exemplo.com', passwordHash, role: 'MAE' },
  })

  const pai = await prisma.user.upsert({
    where: { email: 'pai@exemplo.com' },
    update: {},
    create: { name: 'Carlos Lima', email: 'pai@exemplo.com', passwordHash, role: 'PAI' },
  })

  const existing = await prisma.child.findFirst({
    where: { memberships: { some: { userId: mae.id } } },
  })

  const child = existing ?? (await prisma.child.create({
    data: {
      name: 'Bebê Lima',
      dueDate: new Date('2026-03-15'),
      inviteCode: generateCode(),
      memberships: { create: { userId: mae.id } },
    },
  }))

  await prisma.childMembership.upsert({
    where: { userId_childId: { userId: pai.id, childId: child.id } },
    update: {},
    create: { userId: pai.id, childId: child.id },
  })

  const measurements = [
    { type: 'WEIGHT' as const, value: 3200, unit: 'g', date: new Date('2026-01-10') },
    { type: 'HEIGHT' as const, value: 49, unit: 'cm', date: new Date('2026-01-10') },
    { type: 'BPM' as const, value: 140, unit: 'bpm', date: new Date('2026-01-15') },
    { type: 'WEIGHT' as const, value: 3500, unit: 'g', date: new Date('2026-01-20') },
  ]

  for (const m of measurements) {
    await prisma.measurement.create({
      data: { childId: child.id, recordedByUserId: mae.id, ...m },
    })
  }

  console.log('Seed concluído!')
  console.log(`Mãe: mae@exemplo.com / senha123`)
  console.log(`Pai: pai@exemplo.com / senha123`)
  console.log(`Filho: ${child.name} | inviteCode: ${child.inviteCode}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
