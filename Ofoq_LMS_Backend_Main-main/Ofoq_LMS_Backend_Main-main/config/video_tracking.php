<?php

return [
    'enabled' => env('VIDEO_TRACKING_ENABLED', false),
    'heartbeat_seconds' => (int) env('VIDEO_TRACKING_HEARTBEAT_SECONDS', 20),
    'completion_threshold' => (float) env('VIDEO_TRACKING_COMPLETION_THRESHOLD', 85),
    'max_delta_seconds' => (int) env('VIDEO_TRACKING_MAX_DELTA_SECONDS', 30),
];
