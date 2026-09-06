import { z } from 'zod'

export const createChildSchema = z.object({
  name: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
})

export const joinChildSchema = z.object({
  inviteCode: z.string().min(1, 'Código de convite obrigatório'),
})

export const childParamsSchema = z.object({
  childId: z.string().min(1),
})

export type CreateChildInput = z.infer<typeof createChildSchema>
export type JoinChildInput = z.infer<typeof joinChildSchema>
