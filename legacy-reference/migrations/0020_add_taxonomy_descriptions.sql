-- Add taxonomy_descriptions column to provider_information table
ALTER TABLE provider_information
ADD COLUMN taxonomy_descriptions TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN provider_information.taxonomy_descriptions IS 'Array of descriptions for each taxonomy code, corresponding to the taxonomy_codes array';
