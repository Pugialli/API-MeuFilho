import { z } from 'zod'

const UNITS: Record<string, string> = {
  WEIGHT: 'g',
  HEIGHT: 'cm',
  BPM: 'bpm',
}

export const createMeasurementSchema = z.object({
  type: z.enum(['WEIGHT', 'HEIGHT', 'BPM']),
  value: z.number().positive('Valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  unit: z.string().optional(),
})

export const measurementParamsSchema = z.object({
  childId: z.string().min(1),
})

export const measurementIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const measurementQuerySchema = z.object({
  type: z.enum(['WEIGHT', 'HEIGHT', 'BPM']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export { UNITS }

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>
export type MeasurementQuery = z.infer<typeof measurementQuerySchema>
