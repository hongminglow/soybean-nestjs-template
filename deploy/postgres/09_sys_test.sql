CREATE TABLE IF NOT EXISTS "sys_test" (
  "id" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "test_name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "meta" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3),
  "updated_by" TEXT,
  CONSTRAINT "sys_test_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sys_test_test_code_key" ON "sys_test"("test_code");
