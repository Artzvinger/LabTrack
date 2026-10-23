// Базовый адрес API.
// VITE_API_URL имеет приоритет; иначе обращаемся к тому же хосту,
// с которого открыта страница (localhost, 127.0.0.1, IP в сети).

const API_PORT = '3000';

function resolveApiUrl(): string {
    const fromEnv = import.meta.env.VITE_API_URL;

    if (typeof fromEnv === 'string' && fromEnv.length > 0) {
        return fromEnv.replace(/\/$/, '');
    }

    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();
