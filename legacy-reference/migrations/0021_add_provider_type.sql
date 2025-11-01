-- Add provider_type column to provider_information table
ALTER TABLE provider_information
ADD COLUMN provider_type VARCHAR(1);

-- Add comment to explain the column
COMMENT ON COLUMN provider_information.provider_type IS 'Provider type: 1 for individual provider, 2 for organization provider';
