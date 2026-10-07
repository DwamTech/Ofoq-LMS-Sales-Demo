<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Spatie\Browsershot\Browsershot;

class BeneficiaryReportPdfService
{
    private ?string $cachedLogoDataUri = null;

    public function generate(array $report): string
    {
        $directory = storage_path('app/reports');
        File::ensureDirectoryExists($directory);

        $path = $directory . '/beneficiaries-' . now()->format('Ymd-His') . '-' . uniqid() . '.pdf';
        $html = view('reports.beneficiaries_pdf', [
            'report' => $report,
            'fontRegular' => $this->fontDataUri('Cairo-Regular.ttf'),
            'fontBold' => $this->fontDataUri('Cairo-Bold.ttf'),
            'logo' => $this->logoDataUri(),
        ])->render();

        $browser = Browsershot::html($html)
            ->format('A4')
            ->landscape()
            ->margins(9, 8, 10, 8)
            ->showBackground()
            ->setOption('printBackground', true)
            ->setEnvironmentOptions([
                'SNAP_NAME' => 'chromium',
                'SNAP_INSTANCE_NAME' => 'chromium',
            ])
            ->timeout(120);

        $this->configureBrowser($browser);
        $browser->save($path);

        return $path;
    }

    private function configureBrowser(Browsershot $browser): void
    {
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $nodePath = env($isWindows ? 'BROWSERSHOT_NODE_PATH_WINDOWS' : 'BROWSERSHOT_NODE_PATH_LINUX', env('BROWSERSHOT_NODE_PATH'));
        $chromePath = env($isWindows ? 'BROWSERSHOT_CHROME_PATH_WINDOWS' : 'BROWSERSHOT_CHROME_PATH_LINUX', env('BROWSERSHOT_CHROME_PATH'));

        if (!$isWindows && (empty($chromePath) || !is_executable($chromePath))) {
            foreach (['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium'] as $candidate) {
                if (is_executable($candidate)) {
                    $chromePath = $candidate;
                    break;
                }
            }
        }

        if (!empty($nodePath) && is_file($nodePath)) {
            $browser->setNodeBinary($nodePath);
        }
        if (!empty($chromePath) && is_file($chromePath)) {
            $browser->setChromePath($chromePath);
        }
        if (!$isWindows && filter_var(env('BROWSERSHOT_NO_SANDBOX', true), FILTER_VALIDATE_BOOL)) {
            $browser->noSandbox()->addChromiumArguments([
                'disable-setuid-sandbox',
                'disable-dev-shm-usage',
                'disable-gpu',
                'disable-extensions',
                'no-first-run',
            ]);
        }
    }

    private function fontDataUri(string $filename): string
    {
        $path = public_path('fonts/' . $filename);
        if (!is_file($path)) {
            return '';
        }

        return 'data:font/truetype;base64,' . base64_encode((string) file_get_contents($path));
    }

    private function logoDataUri(): string
    {
        if ($this->cachedLogoDataUri !== null) {
            return $this->cachedLogoDataUri;
        }

        $explicitPath = env('BENEFICIARY_REPORT_LOGO_PATH');
        $paths = array_filter([
            $explicitPath,
            base_path('../frontend/public/logo.png'),
            base_path('../ofuq-frontend/public/logo.png'),
        ]);

        foreach ($paths as $path) {
            if (is_file($path)) {
                return $this->cachedLogoDataUri = $this->imageDataUri($path);
            }
        }

        $publicDirectories = array_filter([
            public_path(),
            base_path('../frontend/public'),
            base_path('../ofuq-frontend/public'),
        ], 'is_dir');

        $matches = collect($publicDirectories)
            ->flatMap(fn (string $directory) => File::allFiles($directory))
            ->filter(fn (\SplFileInfo $file) => in_array(strtolower($file->getExtension()), ['png', 'jpg', 'jpeg', 'webp'], true))
            ->filter(fn (\SplFileInfo $file) => preg_match('/logo|ofuq|أفق/ui', $file->getFilename()))
            ->sortByDesc(fn (\SplFileInfo $file) => $this->logoScore($file->getFilename()));

        $logo = $matches->first();

        return $this->cachedLogoDataUri = $logo ? $this->imageDataUri($logo->getPathname()) : '';
    }

    private function imageDataUri(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeType = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'image/png',
        };

        return 'data:' . $mimeType . ';base64,' . base64_encode((string) file_get_contents($path));
    }

    private function logoScore(string $filename): int
    {
        $name = strtolower(pathinfo($filename, PATHINFO_FILENAME));

        return match (true) {
            $name === 'logo' => 100,
            str_contains($name, 'logo') => 80,
            str_contains($name, 'ofuq') || str_contains($name, 'أفق') => 60,
            default => 0,
        };
    }
}
