-- CreateIndex
CREATE INDEX "Adjustment_barberId_date_idx" ON "Adjustment"("barberId", "date");

-- CreateIndex
CREATE INDEX "Appointment_barberId_idx" ON "Appointment"("barberId");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_barberId_date_idx" ON "Appointment"("barberId", "date");

-- CreateIndex
CREATE INDEX "Appointment_barberId_status_date_idx" ON "Appointment"("barberId", "status", "date");

-- CreateIndex
CREATE INDEX "CashMovement_date_type_idx" ON "CashMovement"("date", "type");

-- CreateIndex
CREATE INDEX "CashMovement_barberId_idx" ON "CashMovement"("barberId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_barberId_idx" ON "Payout"("barberId");
