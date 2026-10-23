ALTER TABLE "users" ADD COLUMN "full_name" varchar(150);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(150);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");