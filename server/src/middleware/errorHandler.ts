import type {
    ErrorRequestHandler,
    RequestHandler,
} from 'express';

import { HttpError } from '../errors/HttpError';

type BodyParserError = Error & {
    status?: number;
    statusCode?: number;
    type?: string;
};

// Сообщения для ошибок body-parser: наружу не отдаём внутренний текст
const clientErrorMessages: Record<string, string> = {
    'entity.parse.failed': 'Некорректный JSON',
    'entity.too.large': 'Слишком большое тело запроса',
    'encoding.unsupported': 'Неподдерживаемая кодировка',
};

function getClientErrorStatus(
    error: BodyParserError,
): number | null {
    const status =
        error.status ?? error.statusCode;

    if (
        typeof status === 'number' &&
        status >= 400 &&
        status < 500
    ) {
        return status;
    }

    return null;
}

export const notFoundHandler: RequestHandler = (
    _req,
    res,
) => {
    res.status(404).json({
        message: 'Не найдено',
    });
};

// Единственное место, где ошибка превращается в ответ API
export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    next,
) => {
    // Если ответ уже начат, отдаём ошибку стандартному обработчику Express
    if (res.headersSent) {
        next(error);
        return;
    }

    // Ошибки, созданные намеренно, отдаём как есть
    if (error instanceof HttpError) {
        const body: {
            message: string;
            errors?: unknown;
        } = {
            message: error.message,
        };

        if (error.details !== undefined) {
            body.errors = error.details;
        }

        res.status(error.status).json(body);
        return;
    }

    // Ошибки клиента: битый JSON, слишком большое тело и т.п.
    if (error instanceof Error) {
        const clientError =
            error as BodyParserError;

        const status =
            getClientErrorStatus(clientError);

        if (status !== null) {
            const message =
                (clientError.type &&
                    clientErrorMessages[
                        clientError.type
                    ]) ||
                'Некорректный запрос';

            res.status(status).json({
                message,
            });
            return;
        }
    }

    // Всё остальное — внутренняя ошибка.
    // Детали (включая SQL) пишем в лог и наружу не отдаём.
    console.error('Unhandled error:', error);

    res.status(500).json({
        message: 'Внутренняя ошибка сервера',
    });
};
