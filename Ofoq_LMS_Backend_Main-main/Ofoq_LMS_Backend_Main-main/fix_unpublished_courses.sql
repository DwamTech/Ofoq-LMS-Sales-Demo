-- Fix for 404 Not Found issue on /courses/{course} routes
-- Problem: Courses have is_published = false or NULL, causing Route Model Binding to fail
-- Solution: Update all courses to be published

-- Step 1: Check current status of courses
SELECT 
    id, 
    title, 
    is_published,
    created_at
FROM courses
ORDER BY id;

-- Step 2: Update all courses to be published
UPDATE courses 
SET is_published = true 
WHERE is_published = false OR is_published IS NULL;

-- Step 3: Verify the update
SELECT 
    COUNT(*) as total_courses,
    SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published_courses,
    SUM(CASE WHEN is_published = false OR is_published IS NULL THEN 1 ELSE 0 END) as unpublished_courses
FROM courses;

-- Step 4: Test a specific course (replace {course_id} with actual ID)
-- SELECT * FROM courses WHERE id = {course_id};
