import type { SampleStatus } from '../types/sample';

// Подписи статусов для интерфейса
export const statusLabels: Record<
    SampleStatus,
    string
> = {
    received: 'Получен',
    processing: 'В обработке',
    completed: 'Завершён',
};

export const statuses: SampleStatus[] = [
    'received',
    'processing',
    'completed',
];
