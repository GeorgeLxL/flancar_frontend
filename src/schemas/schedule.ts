import { z } from 'zod';

export const scheduleItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const scheduleSchema = z.object({
  title: z.string().min(1, '必須項目です'),
  carType: z.string().min(1, '必須項目です'),
  description: z.string().optional(),
  startAt: z.string().min(1, '必須項目です'),
  endAt: z.string().min(1, '必須項目です'),
  storeId: z.string().min(1, '必須項目です'),
  storeName: z.string().min(1),
  assignee: z.string().min(1, '必須項目です'),
  responsible: z.string().min(1, '必須項目です'),
  customerName: z.string().min(1, '必須項目です'),
  requester: z.string().min(1, '必須項目です'),
  items: z.array(scheduleItemSchema).min(1, '商品を1つ以上選択してください'),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;
