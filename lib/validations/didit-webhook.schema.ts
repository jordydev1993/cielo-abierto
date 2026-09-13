import { z } from 'zod'

export const diditWebhookSchema = z.object({
  event_id: z.string(),
  webhook_type: z.string(),
  timestamp: z.number(),
  application_id: z.string(),
  environment: z.enum(['live', 'sandbox']),
  status: z.string(),
  session_id: z.string().optional(),
  vendor_data: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  decision: z.record(z.string(), z.unknown()).optional(),
})

export type DiditWebhookPayload = z.infer<typeof diditWebhookSchema>
