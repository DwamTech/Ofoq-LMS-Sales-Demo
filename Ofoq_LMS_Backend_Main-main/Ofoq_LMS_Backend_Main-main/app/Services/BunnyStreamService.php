<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BunnyStreamService
{
    protected $libraryId;
    protected $apiKey;
    protected $pullZone;
    protected $baseUrl;

    public function __construct()
    {
        $this->libraryId = config('services.bunny.library_id');
        $this->apiKey = config('services.bunny.api_key');
        $this->pullZone = config('services.bunny.pull_zone');
        $this->baseUrl = "https://video.bunnycdn.com/library/{$this->libraryId}";
    }

    /**
     * Get HTTP client configured for BunnyCDN API
     */
    protected function client()
    {
        return Http::withHeaders([
            'AccessKey' => $this->apiKey,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Get or create a collection for a given course name/id
     */
    public function getOrCreateCollection(string $courseName)
    {
        try {
            // First, check if collection exists
            // Bunny Stream API to get collections: GET /library/{libraryId}/collections
            $response = $this->client()->get("{$this->baseUrl}/collections", [
                'search' => $courseName,
                'itemsPerPage' => 100,
            ]);

            if ($response->successful()) {
                $collections = $response->json('items') ?? [];
                
                // Find exact match just in case
                foreach ($collections as $collection) {
                    if ($collection['name'] === $courseName) {
                        return $collection['guid'];
                    }
                }
            }

            // If not found, create it
            // POST /library/{libraryId}/collections
            $createResponse = $this->client()->post("{$this->baseUrl}/collections", [
                'name' => $courseName
            ]);

            if ($createResponse->successful()) {
                return $createResponse->json('guid');
            }

            throw new \Exception("Failed to create Bunny collection: " . $createResponse->body());

        } catch (\Exception $e) {
            Log::error('BunnyCDN Collection Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a new video object in Bunny Stream
     */
    public function createVideo(string $title, ?string $collectionId = null)
    {
        try {
            $payload = ['title' => $title];
            
            if ($collectionId) {
                $payload['collectionId'] = $collectionId;
            }

            $response = $this->client()->post("{$this->baseUrl}/videos", $payload);

            if ($response->successful()) {
                return [
                    'guid' => $response->json('guid'),
                    'title' => $response->json('title'),
                    'collectionId' => $response->json('collectionId')
                ];
            }

            throw new \Exception("Failed to create Bunny video: " . $response->body());

        } catch (\Exception $e) {
            Log::error('BunnyCDN Create Video Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get Video Details
     */
    public function getVideo(string $videoId)
    {
        try {
            $response = $this->client()->get("{$this->baseUrl}/videos/{$videoId}");

            if ($response->successful()) {
                return $response->json();
            }

            return null; // missing or failed
        } catch (\Exception $e) {
            Log::error('BunnyCDN Get Video Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * List videos in the Bunny Stream library.
     */
    public function listVideos(int $page = 1, int $itemsPerPage = 100, ?string $search = null): ?array
    {
        try {
            $query = [
                'page' => $page,
                'itemsPerPage' => $itemsPerPage,
            ];

            if ($search !== null && $search !== '') {
                $query['search'] = $search;
            }

            $response = $this->client()->get("{$this->baseUrl}/videos", $query);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('BunnyCDN List Videos Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get Stream statistics for the whole library or a specific video.
     */
    public function getVideoStatistics(?string $videoGuid = null, ?string $dateFrom = null, ?string $dateTo = null, bool $hourly = false): ?array
    {
        try {
            $query = [
                'hourly' => $hourly,
            ];

            if ($videoGuid) {
                $query['videoGuid'] = $videoGuid;
            }

            if ($dateFrom) {
                $query['dateFrom'] = $dateFrom;
            }

            if ($dateTo) {
                $query['dateTo'] = $dateTo;
            }

            $response = $this->client()->get("{$this->baseUrl}/statistics", $query);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('BunnyCDN Video Statistics Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete Video
     */
    public function deleteVideo(string $videoId)
    {
        try {
            $response = $this->client()->delete("{$this->baseUrl}/videos/{$videoId}");
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('BunnyCDN Delete Video Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get HLS Playlist URL for a video
     */
    public function getHLSUrl(string $videoId): string
    {
        // Example: https://vz-xxx.b-cdn.net/{videoId}/playlist.m3u8
        $host = preg_replace('#^https?://#', '', rtrim($this->pullZone, '/'));
        return "https://{$host}/{$videoId}/playlist.m3u8";
    }

    public function getThumbnailUrl(string $videoId, ?string $thumbnailFileName): ?string
    {
        if (!$thumbnailFileName || !$this->pullZone) {
            return null;
        }

        $host = preg_replace('#^https?://#', '', rtrim($this->pullZone, '/'));
        return "https://{$host}/{$videoId}/{$thumbnailFileName}";
    }

    /**
     * Generate Secure Authorization Signature for TUS Uploads
     * Using SHA256(LibraryId + ApiKey + ExpirationTime + VideoId)
     */
    public function getTusAuthSignature(string $videoId)
    {
        $expirationTime = time() + (3600 * 24); // 24 hours valid
        
        $signatureString = $this->libraryId . $this->apiKey . $expirationTime . $videoId;
        $signature = hash('sha256', $signatureString);

        return [
            'signature' => $signature,
            'expire' => $expirationTime,
            'libraryId' => $this->libraryId
        ];
    }
}
