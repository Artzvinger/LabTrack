import {
    sampleSchema,
    samplesResponseSchema,
} from '../schemas/sample';

import type {
    Sample,
    SampleStatus,
    SamplesResponse,
} from '../types/sample';

import { API_URL } from './base';

type GetSamplesParams = {
    page: number;
    limit: number;
    status: string;
    search: string;
    sort: string;
    order: string;
};

export async function getSamples(
    params: GetSamplesParams,
): Promise<SamplesResponse> {
    const searchParams = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort: params.sort,
        order: params.order,
    });

    if (params.status) {
        searchParams.set(
            'status',
            params.status,
        );
    }

    if (params.search) {
        searchParams.set(
            'search',
            params.search,
        );
    }

    const response = await fetch(
        `${API_URL}/samples?${searchParams}`,
        {
            credentials: 'include',
        },
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Не удалось загрузить образцы',
        );
    }

    const result =
        samplesResponseSchema.safeParse(data);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные образцов',
        );
    }

    return result.data;
}

type SamplePatch = {
    status?: SampleStatus;
    anamnesis?: string | null;
    conclusion?: string | null;
};

export async function patchSample(
    id: number,
    patch: SamplePatch,
): Promise<Sample> {
    const response = await fetch(
        `${API_URL}/samples/${id}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(patch),
        },
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
                'Не удалось изменить статус',
        );
    }

    const result = sampleSchema.safeParse(data);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные образца',
        );
    }

    return result.data;
}

export async function getSample(
    id: number,
): Promise<Sample> {
    const response = await fetch(
        `${API_URL}/samples/${id}`,
        {
            credentials: 'include',
        },
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Не удалось загрузить образец',
        );
    }

    const result =
        sampleSchema.safeParse(data);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные образца',
        );
    }

    return result.data;
}