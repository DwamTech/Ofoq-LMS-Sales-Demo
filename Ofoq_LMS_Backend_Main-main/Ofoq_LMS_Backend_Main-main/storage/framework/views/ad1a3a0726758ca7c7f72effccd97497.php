<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: dejavusans; direction: rtl; color: #132238; }
        .certificate { border: 8px solid #162c4b; padding: 36px 48px; text-align: center; min-height: 430px; }
        .eyebrow { color: #162c4b; font-size: 16px; letter-spacing: 1px; }
        h1 { color: #162c4b; font-size: 34px; margin: 32px 0 12px; }
        .name { color: #b7791f; font-size: 32px; font-weight: bold; margin: 24px 0; }
        .diploma { font-size: 24px; font-weight: bold; margin: 18px 0; }
        .meta { margin-top: 52px; border-top: 1px solid #cbd5df; padding-top: 16px; font-size: 13px; color: #405166; }
        .url { direction: ltr; font-size: 9px; }
    </style>
</head>
<body>
<main class="certificate">
    <div class="eyebrow">OFOQ LMS · شهادة رقم <?php echo e($serialNumber); ?></div>
    <h1>شهادة إتمام دبلوم</h1>
    <p>تشهد منصة أفق بأن المتعلمة</p>
    <div class="name"><?php echo e($studentName); ?></div>
    <p>قد أتمت بنجاح جميع متطلبات الدبلوم</p>
    <div class="diploma"><?php echo e($diplomaName); ?></div>
    <div class="meta">
        <div>تاريخ الإصدار: <?php echo e($issuedAt); ?></div>
        <div class="url"><?php echo e($verificationUrl); ?></div>
    </div>
</main>
</body>
</html>
<?php /**PATH C:\Users\Copy\Desktop\Ofoq\Ofoq_LMS_Backend_Main-main\Ofoq_LMS_Backend_Main-main\resources\views/certificates/demo-diploma.blade.php ENDPATH**/ ?>