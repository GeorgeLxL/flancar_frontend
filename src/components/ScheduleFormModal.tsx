import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';
import { scheduleSchema, type ScheduleFormData } from '../schemas/schedule';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';
import { createSchedule, deleteSchedule, getSchedule, getStaffs, searchProducts, searchCustomers, updateSchedule } from '../api/client';

interface Staff {
  staffId: string;
  staffName: string;
}

interface Props {
  scheduleId?: number | null;
  defaultDate?: Date | null;
  defaultEndDate?: Date | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-gray-200';
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400';

const selectStyles = {
  control: (provided: any) => ({
    ...provided,
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    backgroundColor: 'white',
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    boxShadow: 'none',
    '&:hover': { borderColor: '#e5e7eb' },
    '&:focus-within': { outline: 'none', boxShadow: '0 0 0 2px rgba(229,231,235,0.5)' },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#f3f4f6' : state.isFocused ? '#f9fafb' : 'white',
    color: '#111827',
    fontSize: '0.875rem',
  }),
  singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
  placeholder: (provided: any) => ({ ...provided, color: '#9ca3af' }),
};

function toDatetimeLocal(iso: string) {
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return iso;
  }
}

function snapTo15(value: string): string {
  try {
    const d = new Date(value);
    const snapped = Math.round(d.getMinutes() / 15) * 15;
    d.setMinutes(snapped === 60 ? 0 : snapped, 0, 0);
    if (snapped === 60) d.setHours(d.getHours() + 1);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return value;
  }
}

function DateTimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? value.slice(0, 10) : '';
  const hour = value ? value.slice(11, 13) : '09';
  const minute = value ? value.slice(14, 16) : '00';
  const update = (d: string, h: string, m: string) => onChange(`${d}T${h}:${m}`);

  return (
    <div className="flex gap-1.5">
      <input
        type="date"
        value={date}
        onChange={e => update(e.target.value, hour, minute)}
        className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
      />
      <select
        value={hour}
        onChange={e => update(date, e.target.value, minute)}
        className="w-14 rounded-xl border border-gray-200 bg-white px-1 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <select
        value={minute}
        onChange={e => update(date, hour, e.target.value)}
        className="w-14 rounded-xl border border-gray-200 bg-white px-1 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        {['00', '15', '30', '45'].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

export default function ScheduleFormModal({ scheduleId, defaultDate, defaultEndDate, onClose, onSaved, onDeleted }: Props) {
  const isEdit = Boolean(scheduleId);
  const { user } = useAuth();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const defaultStart = defaultDate ? snapTo15(format(defaultDate, "yyyy-MM-dd'T'HH:mm")) : '';
  const defaultEnd = defaultEndDate ? snapTo15(format(defaultEndDate, "yyyy-MM-dd'T'HH:mm")) : defaultStart;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      items: [],
      startAt: defaultStart,
      endAt: defaultEnd,
      customerId: '',
      customerName: '',
      staffId: user?.staffId || '',
      staffName: user?.staffName || '',
      customer: '',
      requester: '',
    },
  });

  const watchedItems = watch('items');
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    getStaffs().then(data => {
      setStaffs(data);
      if (!isEdit && user?.staffId) {
        setValue('staffId', user.staffId);
        setValue('staffName', user.staffName || '');
      }
    }).catch(() => setStaffs([]));

    if (isEdit && scheduleId) {
      getSchedule(scheduleId).then((schedule: any) => {
        const keys = Object.keys(schedule) as (keyof ScheduleFormData)[];
        for (const key of keys) {
          if (key === 'startAt' || key === 'endAt') {
            setValue(key, snapTo15(toDatetimeLocal(schedule[key])));
          } else {
            setValue(key, schedule[key]);
          }
        }
        setLoading(false);
      });
    }
  }, [scheduleId, isEdit, setValue, user?.staffId, user?.staffName]);

  const loadProductOptions = async (q: string) => {
    const data = await searchProducts(q);
    return data.map((p: any) => ({
      value: p.productId,
      label: `${p.productName} (${p.unitPrice.toLocaleString()}円)`,
      unitPrice: p.unitPrice,
      productName: p.productName,
      maker: p.maker,
      categoryId: p.categoryId,
    }));
  };

  const loadCustomerOptions = async (q: string) => {
    const data = await searchCustomers(q);
    return data.map((c: any) => ({ value: c.customerId, label: c.customerName }));
  };

  const onSubmit = async (data: ScheduleFormData) => {
    const toISO = (local: string) => new Date(local).toISOString();
    const payload = {
      ...data,
      startAt: toISO(data.startAt),
      endAt: toISO(data.endAt),
      items: data.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        maker: item.maker ?? '',
        categoryId: item.categoryId ?? '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    };
    try {
      if (isEdit && scheduleId) await updateSchedule(scheduleId, payload);
      else await createSchedule(payload);
      toast.success(isEdit ? 'スケジュールを更新しました。' : 'スケジュールを作成しました。');
      onSaved();
    } catch {
      toast.error('保存に失敗しました。');
    }
  };

  const field = (label: string, name: keyof ScheduleFormData, type = 'text') => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} {...register(name)} className={inputClass} />
      {errors[name] && <p className="mt-1 text-xs text-red-400">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'スケジュール編集' : '新規スケジュール'}
          </h2>
          <div className="flex gap-2">
            {isEdit && onDeleted && (
              <button
                type="button"
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'このスケジュールを削除しますか？',
                    text: '削除すると元に戻せません。',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: '削除する',
                    cancelButtonText: 'キャンセル',
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true,
                  });
                  if (!result.isConfirmed) return;
                  try {
                    await deleteSchedule(scheduleId!);
                    toast.success('スケジュールを削除しました。');
                    onDeleted();
                  } catch {
                    toast.error('削除に失敗しました。');
                  }
                }}
                className="rounded-xl border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                削除
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">読み込み中...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('タイトル', 'title')}
              {field('車種', 'carType')}
            </div>

            {/* Member (customer) */}
            <div>
              <label className={labelClass}>会員(取引先)</label>
              <AsyncSelect
                loadOptions={loadCustomerOptions}
                defaultOptions
                value={watch('customerId') ? { value: watch('customerId'), label: watch('customerName') } : null}
                onChange={selected => {
                  setValue('customerId', selected?.value || '');
                  setValue('customerName', selected?.label || '');
                }}
                placeholder="検索してください"
                styles={selectStyles}
                noOptionsMessage={() => '該当なし'}
                loadingMessage={() => '検索中...'}
              />
              {errors.customerId && <p className="mt-1 text-xs text-red-400">{errors.customerId.message}</p>}
              <input type="hidden" {...register('customerName')} />
            </div>

            {/* Products */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>商品</label>
                <button
                  type="button"
                  onClick={() => append({ productId: '', productName: '', maker: '', categoryId: '', unitPrice: 0, quantity: 1 })}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 transition"
                >
                  ＋ 追加
                </button>
              </div>
              {errors.items && <p className="mb-2 text-xs text-red-400">{errors.items.message as string}</p>}
              <div className="space-y-2">
                {fields.map((fieldItem, index) => {
                  const currentItem = watchedItems?.[index];
                  const unitPrice = typeof currentItem?.unitPrice === 'number' && Number.isFinite(currentItem.unitPrice) ? currentItem.unitPrice : 0;
                  const qty = typeof currentItem?.quantity === 'number' && Number.isFinite(currentItem.quantity) ? currentItem.quantity : 0;

                  return (
                    <div key={fieldItem.id} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <AsyncSelect
                          loadOptions={loadProductOptions}
                          defaultOptions
                          value={currentItem?.productId ? { value: currentItem.productId, label: `${currentItem.productName} (${unitPrice.toLocaleString()}円)` } : null}
                          onChange={selected => {
                            setValue(`items.${index}.productId`, selected?.value || '');
                            setValue(`items.${index}.productName`, (selected as any)?.productName || '');
                            setValue(`items.${index}.maker`, (selected as any)?.maker || '');
                            setValue(`items.${index}.categoryId`, (selected as any)?.categoryId || '');
                            setValue(`items.${index}.unitPrice`, (selected as any)?.unitPrice || 0);
                          }}
                          placeholder="商品を検索"
                          styles={selectStyles}
                          noOptionsMessage={() => '該当なし'}
                          loadingMessage={() => '検索中...'}
                          className="flex-1"
                        />
                        <input type="hidden" {...register(`items.${index}.productName`)} />
                        <input type="hidden" {...register(`items.${index}.maker`)} />
                        <input type="hidden" {...register(`items.${index}.categoryId`)} />
                        <div className="flex items-center gap-2 text-sm">
                          <input
                            type="number"
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            min={0}
                          />
                          <span className="text-gray-400 text-xs">円</span>
                          <input
                            type="number"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            min={1}
                          />
                          <span className="text-gray-700 font-medium w-24 text-right">{(unitPrice * qty).toLocaleString()}円</span>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="rounded-xl border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>内容</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>開始日時</label>
                <DateTimeSelect value={watch('startAt')} onChange={v => setValue('startAt', v)} />
                {errors.startAt && <p className="mt-1 text-xs text-red-400">{errors.startAt.message}</p>}
              </div>
              <div>
                <label className={labelClass}>終了日時</label>
                <DateTimeSelect value={watch('endAt')} onChange={v => setValue('endAt', v)} />
                {errors.endAt && <p className="mt-1 text-xs text-red-400">{errors.endAt.message}</p>}
              </div>
            </div>

            {/* Staff */}
            <div>
              <label className={labelClass}>担当者</label>
              <Select
                options={staffs.map(s => ({ value: s.staffId, label: s.staffName }))}
                value={
                  staffs.find(s => s.staffId === watch('staffId'))
                    ? { value: watch('staffId'), label: staffs.find(s => s.staffId === watch('staffId'))?.staffName }
                    : null
                }
                onChange={selected => {
                  setValue('staffId', selected?.value || '');
                  setValue('staffName', selected?.label || '');
                }}
                placeholder="選択してください"
                styles={selectStyles}
                isSearchable
              />
              {errors.staffId && <p className="mt-1 text-xs text-red-400">{errors.staffId.message}</p>}
              <input type="hidden" {...register('staffName')} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('お客様名', 'customer')}
              {field('ご依頼者', 'requester')}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
