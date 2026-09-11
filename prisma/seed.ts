import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import 'dotenv/config'
import { customAlphabet } from 'nanoid'
import WebSocket from 'ws'

neonConfig.webSocketConstructor = WebSocket as unknown as typeof globalThis.WebSocket

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

async function main() {
  console.log('Seeding database...')

  const passwordHash = await argon2.hash('1Leon@rdo1')

  const mae = await prisma.user.upsert({
    where: { email: 'amandaportopadilha@gmail.com' },
    update: {},
    create: { name: 'Amanda Porto Padilha', email: 'amandaportopadilha@gmail.com', passwordHash, role: 'MAE' },
  })

  const pai = await prisma.user.upsert({
    where: { email: 'joaopugialli@gmail.com' },
    update: {},
    create: { name: 'João Paulo Pugialli da Silva Souza', email: 'joaopugialli@gmail.com', passwordHash, role: 'PAI' },
  })

  const existing = await prisma.child.findFirst({
    where: { memberships: { some: { userId: mae.id } } },
  })

  const child = existing ?? (await prisma.child.create({
    data: {
      name: 'Leonardo',
      dueDate: new Date('2026-12-17'),
      inviteCode: generateCode(),
      memberships: { create: { userId: mae.id, role: 'MAE' } },
    },
  }))

  await prisma.childMembership.upsert({
    where: { userId_childId: { userId: pai.id, childId: child.id } },
    update: {},
    create: { userId: pai.id, childId: child.id, role: 'PAI' },
  })

  const measurements = [
    { type: 'BPM' as const, value: 142, unit: 'bpm', date: new Date('2026-09-04') },
    { type: 'BPM' as const, value: 144, unit: 'bpm', date: new Date('2026-09-05') },
    { type: 'BPM' as const, value: 136, unit: 'bpm', date: new Date('2026-09-06') },
    { type: 'BPM' as const, value: 152, unit: 'bpm', date: new Date('2026-09-07') },
    { type: 'BPM' as const, value: 144, unit: 'bpm', date: new Date('2026-09-08') },
    { type: 'BPM' as const, value: 144, unit: 'bpm', date: new Date('2026-09-09') },
  ]

  for (const m of measurements) {
    await prisma.measurement.create({
      data: { childId: child.id, recordedByUserId: mae.id, ...m },
    })
  }

  console.log('Seed concluído!')
  console.log(`Mãe: amandaportopadilha@gmail.com`)
  console.log(`Pai: joaopugialli@gmail.com`)
  console.log(`Filho: ${child.name} | inviteCode: ${child.inviteCode}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
