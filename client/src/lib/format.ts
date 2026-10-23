const dateTimeFormatter = new Intl.DateTimeFormat(
    'ru-RU',
    {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    },
);

const numberFormatter = new Intl.NumberFormat('ru-RU');

export function formatDateTime(value: string): string {
    return dateTimeFormatter.format(new Date(value));
}

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}
