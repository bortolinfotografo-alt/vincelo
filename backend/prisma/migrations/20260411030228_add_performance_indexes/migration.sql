-- CreateIndex
CREATE INDEX "freelancer_profiles_available_idx" ON "freelancer_profiles"("available");

-- CreateIndex
CREATE INDEX "freelancer_profiles_location_idx" ON "freelancer_profiles"("location");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_status_jobDate_idx" ON "jobs"("status", "jobDate");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");

-- CreateIndex
CREATE INDEX "jobs_serviceType_idx" ON "jobs"("serviceType");

-- CreateIndex
CREATE INDEX "posts_authorId_createdAt_idx" ON "posts"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "proposals_freelancerId_idx" ON "proposals"("freelancerId");

-- CreateIndex
CREATE INDEX "proposals_jobId_status_idx" ON "proposals"("jobId", "status");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
