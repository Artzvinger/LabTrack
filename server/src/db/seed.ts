import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from './index.js';
import { laboratories, users, samples } from './schema.js';

// Лаборатории проекта
const LABORATORIES = [
    { name: 'Гематология' },
    { name: 'Иммунология' },
];

// Правдоподобные пациенты: фамилии, имена и отчества
const maleSurnames = [
    'Иванов',
    'Смирнов',
    'Кузнецов',
    'Попов',
    'Васильев',
    'Петров',
    'Соколов',
    'Михайлов',
    'Новиков',
    'Фёдоров',
    'Морозов',
    'Волков',
    'Алексеев',
    'Лебедев',
    'Семёнов',
    'Егоров',
    'Павлов',
    'Козлов',
    'Степанов',
    'Николаев',
];

const maleNames = [
    'Александр',
    'Дмитрий',
    'Максим',
    'Сергей',
    'Андрей',
    'Алексей',
    'Иван',
    'Михаил',
    'Никита',
    'Павел',
];

const femaleNames = [
    'Анна',
    'Мария',
    'Елена',
    'Ольга',
    'Наталья',
    'Ирина',
    'Татьяна',
    'Светлана',
    'Юлия',
    'Екатерина',
];

const malePatronymics = [
    'Александрович',
    'Дмитриевич',
    'Сергеевич',
    'Андреевич',
    'Алексеевич',
    'Михайлович',
    'Иванович',
    'Павлович',
];

const femalePatronymics = [
    'Александровна',
    'Дмитриевна',
    'Сергеевна',
    'Андреевна',
    'Алексеевна',
    'Михайловна',
    'Ивановна',
    'Павловна',
];

// Детерминированный генератор: каждый перезапуск даёт те же данные
function createRandom(seed: number) {
    let state = seed >>> 0 || 1;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

function pick<T>(
    list: readonly T[],
    random: () => number,
): T {
    return list[
        Math.floor(random() * list.length)
    ];
}

function createPatientName(index: number): string {
    const random = createRandom(index * 7919 + 17);
    const isFemale = random() < 0.5;

    const surnames = isFemale
        ? maleSurnames.map((surname) => `${surname}а`)
        : maleSurnames;

    const surname = pick(surnames, random);
    const name = pick(
        isFemale ? femaleNames : maleNames,
        random,
    );
    const patronymic = pick(
        isFemale
            ? femalePatronymics
            : malePatronymics,
        random,
    );

    return `${surname} ${name} ${patronymic}`;
}

// Свежие образцы ещё в работе, старые уже закрыты
function getStatus(index: number) {
    if (index <= 120) {
        return 'received' as const;
    }

    if (index <= 240) {
        return 'processing' as const;
    }

    return 'completed' as const;
}

async function seed() {
    console.log('Seeding database...');

    // Лаборатории: добавляем только отсутствующие,
    // чтобы сид можно было запускать на уже заполненной базе
    const existingLabs = await db.select().from(laboratories);
    const existingLabNames = new Set(
        existingLabs.map((lab) => lab.name),
    );

    const missingLabs = LABORATORIES.filter(
        (lab) => !existingLabNames.has(lab.name),
    );

    if (missingLabs.length > 0) {
        await db.insert(laboratories).values(missingLabs);
    }

    const labs = await db.select().from(laboratories);

    function getLab(name: string) {
        const lab = labs.find((item) => item.name === name);

        if (!lab) {
            throw new Error(
                `Laboratory "${name}" was not created`,
            );
        }

        return lab;
    }

    const labA = getLab(LABORATORIES[0].name);
    const labB = getLab(LABORATORIES[1].name);

    // Пользователи: у каждого свой пароль и профиль.
    // Добавляем отсутствующие по логину, чтобы новые аккаунты
    // появлялись и в уже существующей базе.
    const existingUsers = await db.select().from(users);
    const existingUsernames = new Set(
        existingUsers.map((user) => user.username),
    );

    const seededUsers = [
        {
            username: 'admin',
            password: 'Admin2026',
            role: 'admin',
            laboratoryId: null,
            fullName: 'Иванов Пётр Сергеевич',
            email: 'admin@labtrack.local',
        },
        {
            username: 'labuser1',
            password: 'Hemato2026',
            role: 'user',
            laboratoryId: labA.id,
            fullName: 'Смирнова Ольга Викторовна',
            email: 'o.smirnova@labtrack.local',
        },
        {
            username: 'labuser2',
            password: 'Immuno2026',
            role: 'user',
            laboratoryId: labB.id,
            fullName: 'Козлов Дмитрий Андреевич',
            email: 'd.kozlov@labtrack.local',
        },
    ];

    const missingUsers = seededUsers.filter(
        (user) => !existingUsernames.has(user.username),
    );

    if (missingUsers.length > 0) {
        const values = await Promise.all(
            missingUsers.map(async (user) => ({
                username: user.username,
                role: user.role,
                laboratoryId: user.laboratoryId,
                fullName: user.fullName,
                email: user.email,
                passwordHash: await bcrypt.hash(
                    user.password,
                    10,
                ),
            })),
        );

        await db.insert(users).values(values);
    }

    const existingSamples = await db.select().from(samples);

    if (existingSamples.length === 0) {
        const year = new Date().getFullYear();
        const now = Date.now();
        const interval = 45 * 60 * 1000;
        const sampleLabs = [labA, labB];
        // По 200 образцов на каждую лабораторию
        const total = 400;
        const sampleData = [];

        for (let i = 1; i <= total; i++) {
            const receivedAt = new Date(
                now - i * interval,
            );

            sampleData.push({
                code: `S-${year}-${String(i).padStart(4, '0')}`,
                patientName: createPatientName(i),
                status: getStatus(i),
                receivedAt,
                // Запись заводят через полминуты после приёма
                createdAt: new Date(
                    receivedAt.getTime() +
                        (30 + (i % 60)) * 1000,
                ),
                laboratoryId:
                    sampleLabs[i % sampleLabs.length].id,
            });
        }

        for (let i = 0; i < sampleData.length; i += 500) {
            await db
                .insert(samples)
                .values(sampleData.slice(i, i + 500));
        }
    }

    console.log('Seed completed.');
    process.exit(0);
}

seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
