-- Migration: Configure GA4 telemetry settings
-- Date: 2025-01-15
-- Description: Insert Google Analytics 4 credentials for telemetry

-- Insert GA4 configuration
INSERT OR REPLACE INTO user_settings (key, value, category) VALUES
('telemetry.enabled', 'true', 'telemetry'),
('telemetry.ga4_measurement_id', 'G-J9SZS4HVL4', 'telemetry'),
('telemetry.ga4_api_secret', 'KZkQhfwPRGubhNQUBUAyJw', 'telemetry');
