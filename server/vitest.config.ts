import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Тесты работают с одной базой, поэтому файлы идут
        // последовательно: иначе воркеры одновременно создают
        // таблицу сессий и часть запросов падает с 500.
        fileParallelism: false,
    },
});
