import * as fc from 'fast-check';
import { Lesson } from './lessonService';

// Mock the apiClient module before importing lessonService
jest.mock('./apiClient', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}));

// Now import after mocking
import {
    getUserLesson,
    getChapterLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonVisibility,
    completeLesson,
    getLessonNavigation,
    LessonNavigation,
} from './lessonService';
import apiClient from './apiClient';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Bug Condition Exploration: getUserLesson API Response Extraction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property 1: Fault Condition - Correct API Response Extraction
     * 
     * **Validates: Requirements 2.1, 2.2, 2.3**
     * 
     * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
     * 
     * This test verifies that getUserLesson correctly extracts lesson data when the API
     * returns the structure: {message: "Lesson fetched successfully", lesson: {...}}
     * 
     * The bug: The current code tries to access response.data.data, but the API returns
     * the lesson directly in response.data.lesson
     * 
     * Expected behavior on UNFIXED code: Test FAILS because the function cannot extract
     * the lesson data from the correct location (response.data.lesson)
     */
    it('Property 1: should correctly extract lesson data from API response structure {message, lesson}', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate valid lesson IDs (positive integers)
                fc.integer({ min: 1, max: 1000 }),
                // Generate lesson data that matches the Lesson interface
                fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    title: fc.string({ minLength: 1, maxLength: 100 }),
                    content: fc.option(fc.string({ maxLength: 500 })),
                    order: fc.integer({ min: 1, max: 100 }),
                    video_url: fc.option(fc.webUrl()),
                    is_visible: fc.boolean(),
                    chapter_id: fc.integer({ min: 1, max: 100 }),
                }),
                async (lessonId, lessonData) => {
                    // Ensure the lesson ID matches
                    const lesson: Lesson = { ...lessonData, id: lessonId };

                    // Mock the API response with the ACTUAL structure returned by the backend
                    // This is the structure that causes the bug: {message, lesson} not {data: {lesson}}
                    mockedApiClient.get.mockResolvedValueOnce({
                        data: {
                            message: 'Lesson fetched successfully',
                            lesson: lesson,
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    // Call the function under test
                    const result = await getUserLesson(lessonId);

                    // Assertions: Verify the function correctly extracts and returns the lesson data
                    // These assertions will FAIL on unfixed code because the function tries to access
                    // response.data.data which doesn't exist in the actual API response

                    // 1. The result should have a lesson property
                    expect(result).toBeDefined();
                    expect(result.lesson).toBeDefined();

                    // 2. The lesson ID should match the requested ID
                    expect(result.lesson.id).toBe(lessonId);

                    // 3. The lesson should contain all the expected data
                    expect(result.lesson.title).toBe(lesson.title);
                    expect(result.lesson.chapter_id).toBe(lesson.chapter_id);
                    expect(result.lesson.order).toBe(lesson.order);
                    expect(result.lesson.is_visible).toBe(lesson.is_visible);

                    // 4. Optional fields should be preserved
                    if (lesson.video_url !== undefined) {
                        expect(result.lesson.video_url).toBe(lesson.video_url);
                    }
                    if (lesson.content !== undefined) {
                        expect(result.lesson.content).toBe(lesson.content);
                    }

                    // 5. Verify the watch page can render with this data structure
                    // The watch page expects to access lessonData.lesson
                    expect(result.lesson).toHaveProperty('id');
                    expect(result.lesson).toHaveProperty('title');
                }
            ),
            {
                numRuns: 50, // Run 50 test cases with different lesson IDs and data
                verbose: true, // Show counterexamples when test fails
            }
        );
    });

    /**
     * Concrete test case: Basic lesson fetch with video
     * 
     * This is a specific example that demonstrates the bug condition clearly
     */
    it('should extract lesson data for a video lesson (concrete example)', async () => {
        const lessonId = 1;
        const lesson: Lesson = {
            id: 1,
            title: 'Introduction to Programming',
            content: 'Learn the basics of programming',
            order: 1,
            video_url: 'https://example.com/video.mp4',
            is_visible: true,
            chapter_id: 1,
        };

        // Mock the actual API response structure
        mockedApiClient.get.mockResolvedValueOnce({
            data: {
                message: 'Lesson fetched successfully',
                lesson: lesson,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        });

        const result = await getUserLesson(lessonId);

        // These assertions will FAIL on unfixed code
        expect(result.lesson).toBeDefined();
        expect(result.lesson.id).toBe(1);
        expect(result.lesson.title).toBe('Introduction to Programming');
        expect(result.lesson.video_url).toBe('https://example.com/video.mp4');
    });

    /**
     * Concrete test case: Text-only lesson (no video)
     * 
     * Tests that the extraction works for lessons without video_url
     */
    it('should extract lesson data for a text-only lesson (concrete example)', async () => {
        const lessonId = 5;
        const lesson: Lesson = {
            id: 5,
            title: 'Reading Assignment',
            content: 'Read chapters 1-3',
            order: 5,
            is_visible: true,
            chapter_id: 2,
        };

        mockedApiClient.get.mockResolvedValueOnce({
            data: {
                message: 'Lesson fetched successfully',
                lesson: lesson,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        });

        const result = await getUserLesson(lessonId);

        // These assertions will FAIL on unfixed code
        expect(result.lesson).toBeDefined();
        expect(result.lesson.id).toBe(5);
        expect(result.lesson.title).toBe('Reading Assignment');
        expect(result.lesson.video_url).toBeUndefined();
    });
});

/**
 * Property 2: Preservation - Admin and Other Endpoints Unchanged
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * IMPORTANT: These tests follow observation-first methodology
 * 
 * These tests verify that all API calls NOT involving the /lessons/{id} endpoint
 * (admin endpoints, lesson completion, navigation) continue to work exactly as before.
 * 
 * Expected behavior on UNFIXED code: Tests PASS (confirms baseline behavior to preserve)
 */
describe('Preservation Property Tests: Admin and Other Endpoints Unchanged', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Preservation Test 1: Admin getChapterLessons works with {data: Lesson[]} structure
     */
    it('Property 2.1: getChapterLessons should work correctly with {data: Lesson[]} response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate chapter ID
                fc.integer({ min: 1, max: 100 }),
                // Generate array of lessons
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        title: fc.string({ minLength: 1, maxLength: 100 }),
                        content: fc.option(fc.string({ maxLength: 500 })),
                        order: fc.integer({ min: 1, max: 100 }),
                        video_url: fc.option(fc.webUrl()),
                        is_visible: fc.boolean(),
                        chapter_id: fc.integer({ min: 1, max: 100 }),
                    }),
                    { minLength: 0, maxLength: 10 }
                ),
                async (chapterId, lessons) => {
                    // Mock the admin API response with {data: Lesson[]} structure
                    mockedApiClient.get.mockResolvedValueOnce({
                        data: {
                            data: lessons,
                            message: 'Lessons fetched successfully',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    const result = await getChapterLessons(chapterId);

                    // Verify the function returns the lessons array correctly
                    expect(result).toBeDefined();
                    expect(Array.isArray(result)).toBe(true);
                    expect(result.length).toBe(lessons.length);

                    // Verify each lesson is preserved correctly
                    result.forEach((lesson, index) => {
                        expect(lesson.id).toBe(lessons[index].id);
                        expect(lesson.title).toBe(lessons[index].title);
                        expect(lesson.chapter_id).toBe(lessons[index].chapter_id);
                    });
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 2: Admin createLesson works with {data: Lesson} structure
     */
    it('Property 2.2: createLesson should work correctly with {data: Lesson} response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate chapter ID
                fc.integer({ min: 1, max: 100 }),
                // Generate lesson data for creation
                fc.record({
                    title: fc.string({ minLength: 1, maxLength: 100 }),
                    content: fc.option(fc.string({ maxLength: 500 })),
                    order: fc.integer({ min: 1, max: 100 }),
                    video_url: fc.option(fc.webUrl()),
                    is_visible: fc.boolean(),
                }),
                async (chapterId, lessonData) => {
                    // Create the full lesson object that would be returned
                    const createdLesson: Lesson = {
                        id: Math.floor(Math.random() * 1000) + 1,
                        chapter_id: chapterId,
                        ...lessonData,
                    };

                    // Mock the admin API response with {data: Lesson} structure
                    mockedApiClient.post.mockResolvedValueOnce({
                        data: {
                            data: createdLesson,
                            message: 'Lesson created successfully',
                        },
                        status: 201,
                        statusText: 'Created',
                        headers: {},
                        config: {} as any,
                    });

                    const result = await createLesson(chapterId, lessonData);

                    // Verify the function returns the created lesson correctly
                    expect(result).toBeDefined();
                    expect(result.id).toBe(createdLesson.id);
                    expect(result.title).toBe(lessonData.title);
                    expect(result.chapter_id).toBe(chapterId);
                    expect(result.order).toBe(lessonData.order);
                    expect(result.is_visible).toBe(lessonData.is_visible);
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 3: Admin updateLesson works with {data: Lesson} structure
     */
    it('Property 2.3: updateLesson should work correctly with {data: Lesson} response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate lesson ID
                fc.integer({ min: 1, max: 1000 }),
                // Generate lesson update data
                fc.record({
                    title: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                    content: fc.option(fc.string({ maxLength: 500 })),
                    order: fc.option(fc.integer({ min: 1, max: 100 })),
                    video_url: fc.option(fc.webUrl()),
                    is_visible: fc.option(fc.boolean()),
                }),
                async (lessonId, updateData) => {
                    // Create the updated lesson object
                    const updatedLesson: Lesson = {
                        id: lessonId,
                        title: updateData.title || 'Default Title',
                        order: updateData.order || 1,
                        is_visible: updateData.is_visible !== undefined ? updateData.is_visible : true,
                        chapter_id: 1,
                        content: updateData.content,
                        video_url: updateData.video_url,
                    };

                    // Mock the admin API response with {data: Lesson} structure
                    mockedApiClient.put.mockResolvedValueOnce({
                        data: {
                            data: updatedLesson,
                            message: 'Lesson updated successfully',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    const result = await updateLesson(lessonId, updateData);

                    // Verify the function returns the updated lesson correctly
                    expect(result).toBeDefined();
                    expect(result.id).toBe(lessonId);
                    if (updateData.title) expect(result.title).toBe(updateData.title);
                    if (updateData.order) expect(result.order).toBe(updateData.order);
                    if (updateData.is_visible !== undefined) expect(result.is_visible).toBe(updateData.is_visible);
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 4: Admin deleteLesson works correctly
     */
    it('Property 2.4: deleteLesson should work correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate lesson ID
                fc.integer({ min: 1, max: 1000 }),
                async (lessonId) => {
                    // Mock the admin API response for delete
                    mockedApiClient.delete.mockResolvedValueOnce({
                        data: {
                            message: 'Lesson deleted successfully',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    // Should not throw an error
                    await expect(deleteLesson(lessonId)).resolves.not.toThrow();

                    // Verify the delete endpoint was called with correct lesson ID
                    expect(mockedApiClient.delete).toHaveBeenCalledWith(`/admin/lessons/${lessonId}`);
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 5: Admin toggleLessonVisibility works with {data: Lesson} structure
     */
    it('Property 2.5: toggleLessonVisibility should work correctly with {data: Lesson} response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate lesson ID
                fc.integer({ min: 1, max: 1000 }),
                // Generate initial visibility state
                fc.boolean(),
                async (lessonId, initialVisibility) => {
                    // Create the lesson with toggled visibility
                    const toggledLesson: Lesson = {
                        id: lessonId,
                        title: 'Test Lesson',
                        order: 1,
                        is_visible: !initialVisibility, // Toggled
                        chapter_id: 1,
                    };

                    // Mock the admin API response with {data: Lesson} structure
                    mockedApiClient.patch.mockResolvedValueOnce({
                        data: {
                            data: toggledLesson,
                            message: 'Lesson visibility toggled successfully',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    const result = await toggleLessonVisibility(lessonId);

                    // Verify the function returns the lesson with toggled visibility
                    expect(result).toBeDefined();
                    expect(result.id).toBe(lessonId);
                    expect(result.is_visible).toBe(!initialVisibility);
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 6: Student completeLesson works correctly
     */
    it('Property 2.6: completeLesson should work correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate lesson ID
                fc.integer({ min: 1, max: 1000 }),
                async (lessonId) => {
                    // Mock the student API response for lesson completion
                    mockedApiClient.post.mockResolvedValueOnce({
                        data: {
                            message: 'Lesson completed successfully',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    // Should not throw an error
                    await expect(completeLesson(lessonId)).resolves.not.toThrow();

                    // Verify the complete endpoint was called with correct lesson ID
                    expect(mockedApiClient.post).toHaveBeenCalledWith(`/lessons/${lessonId}/complete`);
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Preservation Test 7: Student getLessonNavigation works with {data: LessonNavigation} structure
     */
    it('Property 2.7: getLessonNavigation should work correctly with {data: LessonNavigation} response structure', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate lesson ID
                fc.integer({ min: 1, max: 1000 }),
                // Generate navigation data
                fc.record({
                    prev: fc.option(
                        fc.record({
                            id: fc.integer({ min: 1, max: 1000 }),
                            chapterId: fc.integer({ min: 1, max: 100 }),
                        })
                    ),
                    next: fc.option(
                        fc.record({
                            id: fc.integer({ min: 1, max: 1000 }),
                            chapterId: fc.integer({ min: 1, max: 100 }),
                        })
                    ),
                    is_next_last: fc.boolean(),
                }),
                async (lessonId, navigationData) => {
                    const navigation: LessonNavigation = {
                        prev: navigationData.prev || null,
                        next: navigationData.next || null,
                        is_next_last: navigationData.is_next_last,
                    };

                    // Mock the student API response with {data: LessonNavigation} structure
                    mockedApiClient.get.mockResolvedValueOnce({
                        data: {
                            data: navigation,
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any,
                    });

                    const result = await getLessonNavigation(lessonId);

                    // Verify the function returns the navigation data correctly
                    expect(result).toBeDefined();
                    expect(result.is_next_last).toBe(navigation.is_next_last);

                    if (navigation.prev) {
                        expect(result.prev).toBeDefined();
                        expect(result.prev?.id).toBe(navigation.prev.id);
                        expect(result.prev?.chapterId).toBe(navigation.prev.chapterId);
                    } else {
                        expect(result.prev).toBeNull();
                    }

                    if (navigation.next) {
                        expect(result.next).toBeDefined();
                        expect(result.next?.id).toBe(navigation.next.id);
                        expect(result.next?.chapterId).toBe(navigation.next.chapterId);
                    } else {
                        expect(result.next).toBeNull();
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Concrete preservation test: Verify admin operations work as expected
     */
    it('should preserve admin lesson operations (concrete example)', async () => {
        const chapterId = 1;
        const lessons: Lesson[] = [
            { id: 1, title: 'Lesson 1', order: 1, is_visible: true, chapter_id: 1 },
            { id: 2, title: 'Lesson 2', order: 2, is_visible: false, chapter_id: 1 },
        ];

        // Test getChapterLessons
        mockedApiClient.get.mockResolvedValueOnce({
            data: { data: lessons },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        });

        const result = await getChapterLessons(chapterId);
        expect(result).toEqual(lessons);
    });

    /**
     * Concrete preservation test: Verify lesson completion works as expected
     */
    it('should preserve lesson completion functionality (concrete example)', async () => {
        const lessonId = 5;

        mockedApiClient.post.mockResolvedValueOnce({
            data: { message: 'Lesson completed successfully' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        });

        await expect(completeLesson(lessonId)).resolves.not.toThrow();
        expect(mockedApiClient.post).toHaveBeenCalledWith(`/lessons/${lessonId}/complete`);
    });

    /**
     * Concrete preservation test: Verify lesson navigation works as expected
     */
    it('should preserve lesson navigation functionality (concrete example)', async () => {
        const lessonId = 3;
        const navigation: LessonNavigation = {
            prev: { id: 2, chapterId: 1 },
            next: { id: 4, chapterId: 1 },
            is_next_last: false,
        };

        mockedApiClient.get.mockResolvedValueOnce({
            data: { data: navigation },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
        });

        const result = await getLessonNavigation(lessonId);
        expect(result).toEqual(navigation);
    });
});
