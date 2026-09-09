import { z } from 'zod'

export const sexEnum = z.enum(['MALE', 'FEMALE', 'UNKNOWN'])

export const createChildSchema = z.object({
  name: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  sex: sexEnum.optional(),
})

export const updateChildSchema = z.object({
  name: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  sex: sexEnum.optional(),
})

export const joinChildSchema = z.object({
  inviteCode: z.string().min(1, 'Código de convite obrigatório'),
})

export const childParamsSchema = z.object({
  childId: z.string().min(1),
})

export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>
export type JoinChildInput = z.infer<typeof joinChildSchema>
