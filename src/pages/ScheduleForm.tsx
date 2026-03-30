import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema, type ScheduleFormData } from '../schemas/schedule';
import { createSchedule, getProducts, getSchedule, getStores, updateSchedule } from '../api/client';

interface Product {
  productId: string;
  productName: string;
  unitPrice: number;
}

interface Store {
  storeId: string;
  storeName: string;
}

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-gray-200';
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400';

export default function ScheduleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { items: [] },
  });

  const watchedItems = watch('items');
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
    getStores().then(setStores).catch(() => setStores([]));

    if (isEdit) {
      getSchedule(Number(id)).then((schedule: any) => {
        Object.keys(schedule).forEach(key => setValue(key as keyof ScheduleFormData, schedule[key]));
      });
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: ScheduleFormData) => {
    if (isEdit) await updateSchedule(Number(id), data);
    else await createSchedule(data);
    navigate('/');
  };

  const field = (label: string, name: keyof ScheduleFormData, type = 'text') => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} {...register(name)} className={inputClass} />
      {errors[name] && <p className="mt-1 text-xs text-red-400">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">{isEdit ? 'スケジュール編集' : '新規スケジュール'}</h1>
          <p className="mt-0.5 text-sm text-gray-400">必要項目を入力して、商品価格付きの書類を作成します。</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {field('タイトル', 'title')}
            {field('車種', 'carType')}
          </div>

          <div>
            <label className={labelClass}>内容</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {field('開始日時', 'startAt', 'datetime-local')}
            {field('終了日時', 'endAt', 'datetime-local')}
          </div>

          <div>
            <label className={labelClass}>店舗</label>
            <select
              {...register('storeId')}
              onChange={event => {
                const store = stores.find(item => item.storeId === event.target.value);
                setValue('storeId', event.target.value);
                setValue('storeName', store?.storeName ?? '');
              }}
              className={inputClass}
            >
              <option value="">選択してください</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </select>
            {errors.storeId && <p className="mt-1 text-xs text-red-400">{errors.storeId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {field('担当者', 'assignee')}
            {field('責任者', 'responsible')}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {field('お客様名', 'customerName')}
            {field('ご依頼者', 'requester')}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className={labelClass}>商品</label>
              <button
                type="button"
                onClick={() => append({ productId: '', productName: '', unitPrice: 0, quantity: 1 })}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-400 transition hover:text-gray-700"
              >
                ＋ 追加
              </button>
            </div>
            {errors.items && <p className="mb-2 text-xs text-red-400">{errors.items.message}</p>}
            <div className="space-y-3">
              {fields.map((fieldItem, index) => {
                const currentItem = watchedItems?.[index];
                const currentProduct = products.find(product => product.productId === currentItem?.productId);
                const currentUnitPrice = currentProduct?.unitPrice ?? currentItem?.unitPrice ?? 0;
                const quantity = typeof currentItem?.quantity === 'number' && Number.isFinite(currentItem.quantity) ? currentItem.quantity : 0;
                const lineTotal = currentUnitPrice * quantity;

                return (
                  <div key={fieldItem.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
                      <select
                        {...register(`items.${index}.productId`)}
                        onChange={event => {
                          const product = products.find(item => item.productId === event.target.value);
                          setValue(`items.${index}.productId`, event.target.value);
                          setValue(`items.${index}.productName`, product?.productName ?? '');
                          setValue(`items.${index}.unitPrice`, product?.unitPrice ?? 0);
                        }}
                        className="w-full md:flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        <option value="">商品を選択</option>
                        {products.map(product => (
                          <option key={product.productId} value={product.productId}>
                            {product.productName} ({product.unitPrice.toLocaleString()}円)
                          </option>
                        ))}
                      </select>
                      <input type="hidden" {...register(`items.${index}.productName`)} />
                      <input type="hidden" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:flex md:items-center md:gap-2">
                        <div className="md:w-28">
                          <div className="mb-1 text-xs text-gray-400 md:hidden">単価</div>
                          <div className="text-sm text-gray-500 md:text-right">{currentUnitPrice.toLocaleString()}円</div>
                        </div>
                        <div className="md:w-20">
                          <div className="mb-1 text-xs text-gray-400 md:hidden">数量</div>
                          <input
                            type="number"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="数量"
                            min={1}
                          />
                        </div>
                        <div className="md:w-28">
                          <div className="mb-1 text-xs text-gray-400 md:hidden">合計</div>
                          <div className="text-sm font-medium text-gray-700 md:text-right">{lineTotal.toLocaleString()}円</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="self-end rounded-xl border border-red-200 px-3 py-1.5 text-sm text-red-500 transition hover:bg-red-50 md:self-auto"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-8 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-700"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl border border-gray-200 px-8 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
