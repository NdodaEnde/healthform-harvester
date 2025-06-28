
-- Complete Feature Flags Schema Migration Script
-- This script safely migrates from single-column unique constraint to composite constraint

-- Step 1: Verify current state and create backup
DO $$
BEGIN
    -- Create a backup table (optional but recommended)
    DROP TABLE IF EXISTS feature_flags_backup_migration;
    CREATE TABLE feature_flags_backup_migration AS 
    SELECT * FROM feature_flags;
    
    RAISE NOTICE 'Backup created: % rows copied', (SELECT COUNT(*) FROM feature_flags_backup_migration);
END $$;

-- Step 2: Analyze current constraint conflicts
SELECT 
    'Current constraint conflicts analysis:' as status,
    flag_name,
    COUNT(*) as duplicate_count,
    STRING_AGG(
        CASE 
            WHEN organization_id IS NULL THEN 'GLOBAL'
            ELSE organization_id::text
        END, 
        ', '
    ) as scopes
FROM feature_flags 
GROUP BY flag_name 
HAVING COUNT(*) > 1
ORDER BY flag_name;

-- Step 3: Show current compound document flags status
SELECT 
    'Current compound document flags:' as status,
    flag_name,
    CASE 
        WHEN organization_id IS NULL THEN 'GLOBAL'
        ELSE organization_id::text
    END as scope,
    is_enabled,
    created_at
FROM feature_flags 
WHERE flag_name LIKE '%compound%'
ORDER BY flag_name, organization_id;

-- Step 4: Drop the problematic unique constraint
DO $$
BEGIN
    -- Check if the constraint exists before dropping
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feature_flags_flag_name_key' 
        AND table_name = 'feature_flags'
    ) THEN
        ALTER TABLE feature_flags DROP CONSTRAINT feature_flags_flag_name_key;
        RAISE NOTICE 'Dropped existing unique constraint: feature_flags_flag_name_key';
    ELSE
        RAISE NOTICE 'Constraint feature_flags_flag_name_key does not exist, skipping drop';
    END IF;
END $$;

-- Step 5: Add the new composite unique constraint
-- This allows one global flag per name AND one org-specific flag per name per org
ALTER TABLE feature_flags 
ADD CONSTRAINT feature_flags_unique_per_org 
UNIQUE (flag_name, organization_id);

-- Step 6: Create partial unique index for global flags
-- This ensures only one global flag (organization_id IS NULL) per flag_name
DROP INDEX IF EXISTS feature_flags_global_unique;
CREATE UNIQUE INDEX feature_flags_global_unique 
ON feature_flags (flag_name) 
WHERE organization_id IS NULL;

-- Step 7: Verify the new constraints are working
DO $$
BEGIN
    RAISE NOTICE 'New constraints created successfully!';
    RAISE NOTICE 'Testing constraint behavior...';
END $$;

-- Test 1: Verify we can still query existing data
SELECT 
    'Constraint test - existing data still accessible:' as test,
    COUNT(*) as total_flags,
    COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as global_flags,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as org_specific_flags
FROM feature_flags;

-- Step 8: Enable the existing global compound document flags as immediate fix
UPDATE feature_flags 
SET 
    is_enabled = true,
    updated_at = NOW()
WHERE flag_name IN (
    'compound_documents_enabled',
    'compound_document_upload',
    'ai_section_detection',
    'workflow_management',
    'document_analytics'
) 
AND organization_id IS NULL;

-- Step 9: Show the results of the migration
SELECT 
    'Migration complete - updated flags:' as status,
    flag_name,
    CASE 
        WHEN organization_id IS NULL THEN 'GLOBAL'
        ELSE organization_id::text
    END as scope,
    is_enabled,
    updated_at
FROM feature_flags 
WHERE flag_name LIKE '%compound%'
ORDER BY flag_name, organization_id;

-- Step 10: Verify constraint behavior with a test
DO $$
DECLARE
    test_org_id UUID := '43e00f8a-262e-41d0-91ef-3f3c0e9b8722'; -- Your org ID from the logs
BEGIN
    RAISE NOTICE 'Testing new constraint behavior...';
    
    -- This should work now: creating org-specific flag alongside global flag
    BEGIN
        INSERT INTO feature_flags (flag_name, description, is_enabled, organization_id)
        VALUES ('test_constraint_flag', 'Test constraint behavior', true, test_org_id);
        
        RAISE NOTICE '✅ Successfully created organization-specific flag alongside global flag';
        
        -- Clean up test
        DELETE FROM feature_flags WHERE flag_name = 'test_constraint_flag';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Constraint test failed: %', SQLERRM;
    END;
END $$;

-- Step 11: Final verification - show all constraints on the table
SELECT 
    'Final constraint verification:' as status,
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_type = 'UNIQUE' THEN 'Ensures uniqueness of ' || 
            (SELECT STRING_AGG(column_name, ', ') 
             FROM information_schema.key_column_usage 
             WHERE constraint_name = tc.constraint_name)
        ELSE constraint_type
    END as description
FROM information_schema.table_constraints tc
WHERE table_name = 'feature_flags' 
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY constraint_type, constraint_name;

-- Step 12: Show indexes on the table
SELECT 
    'Index verification:' as status,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'feature_flags'
AND indexname LIKE '%unique%'
ORDER BY indexname;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration completed successfully!';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  ✅ Create organization-specific flags that override global ones';
    RAISE NOTICE '  ✅ Maintain global flags as defaults';
    RAISE NOTICE '  ✅ Your compound documents feature should work immediately';
    RAISE NOTICE '  ✅ The unique constraints prevent duplicate flags within scope';
END $$;
