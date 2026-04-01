import { z } from 'zod';

const req = z.string({ error: '必須項目です' }).min(1, '必須項目です');

export const scheduleItemSchema = z.object({
  productId: req,
  productName: req,
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const scheduleSchema = z.object({
  title: req,
  carType: req,
  description: z.string().optional(),
  startAt: req,
  endAt: req,
  staffId: req,
  staffName: req,
  assignee: req,
  responsible: req,
  customerName: req,
  requester: req,
  items: z.array(scheduleItemSchema).min(1, '商品を1つ以上選択してください'),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;
