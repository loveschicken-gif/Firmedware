-- AI Connector Gateway firm settings (disabled by default; no API keys in DB)
ALTER TABLE "FirmSettings" ADD COLUMN "enableAIConnectors" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FirmSettings" ADD COLUMN "aiConnectorMode" TEXT NOT NULL DEFAULT 'DISABLED';
ALTER TABLE "FirmSettings" ADD COLUMN "aiConnectorProvider" TEXT;
