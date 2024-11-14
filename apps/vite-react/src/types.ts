import { z } from "zod";

export const taskSchema = z.object({
  id: z.number(),
  task_id: z.string().uuid(),
  task_file_name: z.string(),
  date_created: z.string(),
  date_done: z.string(),
  type: z.enum(["file"]),
  status: z.enum(["SUCCESS", "FAILURE", "PENDING"]),
  result: z.string(),
  acknowledged: z.boolean(),
  related_document: z.string(),
});

export type TaskType = z.infer<typeof taskSchema>;

export const documentSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string(),
  tags: z.array(z.number().optional()).default([]).optional(),
  document_type: z.string().nullable().optional(),
  correspondent: z.string().nullable().optional(),
  created: z.string().optional(),
  created_date: z.string().optional(),
  modified: z.string().optional(),
  added: z.string().optional(),
  archive_serial_number: z.string().nullable(),
  original_file_name: z.string().optional(),
  archived_file_name: z.string().nullable().optional(),
  notes: z.array(z.string().optional()).default([]).optional(),
  page_count: z.number().int().nonnegative().nullable(),
  set_permissions: z.boolean().optional(),
  custom_fields: z
    .array(
      z.object({
        field: z.number().int().nonnegative(),
        value: z.any(),
      })
    )
    .default([]),
});

export type DocumentType = z.infer<typeof documentSchema>;
