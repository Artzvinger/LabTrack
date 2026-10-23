import {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    pgEnum,
} from 'drizzle-orm/pg-core';

export const laboratories = pgTable('laboratories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    laboratoryId: integer('laboratory_id'),
    fullName: varchar('full_name', { length: 150 }),
    email: varchar('email', { length: 150 }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sampleStatus = pgEnum('sample_status', [
    'received',
    'processing',
    'completed',
]);

export const samples = pgTable('samples', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    patientName: varchar('patient_name', { length: 150 }).notNull(),
    anamnesis: text('anamnesis'),
    conclusion: text('conclusion'),
    status: sampleStatus('status').notNull(),
    receivedAt: timestamp('received_at').notNull(),
    laboratoryId: integer('laboratory_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});