import { z } from "zod";

export const leadSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    email: z.email().max(255).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional(),
    company: z.string().trim().max(200).optional(),
    source: z.string().trim().min(2).max(80),
    interest: z.string().trim().max(2000).optional(),
  })
  .refine((v) => !!v.email || !!v.phone, {
    message: "Informe e-mail ou telefone",
  });

export const webhookLeadSchema = leadSchema.safeExtend({
  external_event_id: z.string().trim().min(1).max(160),
});

export const stages = [
  "Novo lead",
  "Em contato",
  "Proposta",
  "Ganho",
  "Perdido",
] as const;
export const stageSchema = z.enum(stages);
