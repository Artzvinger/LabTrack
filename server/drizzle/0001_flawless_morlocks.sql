ALTER TABLE "samples" ADD COLUMN "code" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_code_unique" UNIQUE("code");