-- Reset certificate status for student "عبد الحكيم   عبدلي عبد" to pending for retry
-- This will allow the queue to regenerate the certificate

-- Find the student's diploma certificate
SELECT 
    dc.id,
    dc.user_id,
    u.name as student_name,
    dc.diploma_id,
    c.name as diploma_name,
    dc.status,
    dc.file_path,
    dc.created_at,
    dc.updated_at
FROM diploma_certificates dc
JOIN users u ON dc.user_id = u.id
JOIN category_of_courses c ON dc.diploma_id = c.id
WHERE u.name LIKE '%عبد الحكيم%';

-- Reset the certificate status to pending
UPDATE diploma_certificates dc
JOIN users u ON dc.user_id = u.id
SET 
    dc.status = 'pending',
    dc.file_path = NULL,
    dc.updated_at = NOW()
WHERE u.name LIKE '%عبد الحكيم%'
AND dc.status = 'failed';

-- Verify the update
SELECT 
    dc.id,
    u.name as student_name,
    c.name as diploma_name,
    dc.status,
    dc.file_path,
    dc.updated_at
FROM diploma_certificates dc
JOIN users u ON dc.user_id = u.id
JOIN category_of_courses c ON dc.diploma_id = c.id
WHERE u.name LIKE '%عبد الحكيم%';
