
-- Fix existing patient birthdates that have the off-by-one-day error
-- This will recalculate birthdates from ID numbers using the corrected algorithm

UPDATE patients 
SET birthdate_from_id = (
  CASE 
    WHEN id_number IS NOT NULL AND id_number ~ '^\d{13}$' THEN
      -- Extract year, month, day from ID number
      CASE 
        WHEN 
          SUBSTRING(id_number, 3, 2)::integer BETWEEN 1 AND 12 AND  -- valid month
          SUBSTRING(id_number, 5, 2)::integer BETWEEN 1 AND 31      -- valid day
        THEN
          -- Determine century (pivot at 25: 00-24 = 2000s, 25-99 = 1900s)
          CASE 
            WHEN SUBSTRING(id_number, 1, 2)::integer < 25 THEN
              ('20' || SUBSTRING(id_number, 1, 2) || '-' || 
               LPAD(SUBSTRING(id_number, 3, 2), 2, '0') || '-' || 
               LPAD(SUBSTRING(id_number, 5, 2), 2, '0'))::date
            ELSE
              ('19' || SUBSTRING(id_number, 1, 2) || '-' || 
               LPAD(SUBSTRING(id_number, 3, 2), 2, '0') || '-' || 
               LPAD(SUBSTRING(id_number, 5, 2), 2, '0'))::date
          END
        ELSE birthdate_from_id  -- Keep existing value if invalid
      END
    ELSE birthdate_from_id  -- Keep existing value if no valid ID number
  END
)
WHERE 
  id_number IS NOT NULL 
  AND id_number ~ '^\d{13}$'  -- Only process valid 13-digit ID numbers
  AND birthdate_from_id IS NOT NULL;  -- Only update records that already have a birthdate_from_id
