export type User = {
    id: number;
    username: string;
    role: string;
    laboratoryId: number | null;
    laboratoryName: string | null;
    fullName: string | null;
    email: string | null;
    createdAt: string;
};

export type SampleStatus =
    | 'received'
    | 'processing'
    | 'completed';

export type StatusCounts = Record<SampleStatus, number>;

export type Sample = {
    id: number;
    code: string;
    patientName: string;
    anamnesis: string | null;
    conclusion: string | null;
    status: SampleStatus;
    receivedAt: string;
    laboratoryId: number;
    laboratoryName: string | null;
    createdAt: string;
};

export type SamplesResponse = {
    data: Sample[];
    total: number;
    page: number;
    limit: number;
    counts: StatusCounts;
};
