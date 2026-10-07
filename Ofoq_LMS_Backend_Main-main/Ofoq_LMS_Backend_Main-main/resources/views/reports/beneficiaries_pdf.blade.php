<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>تقرير المستفيدين والإنجاز</title>
    <style>
        @font-face { font-family: Cairo; src: url('{{ $fontRegular }}') format('truetype'); font-weight: 400; }
        @font-face { font-family: Cairo; src: url('{{ $fontBold }}') format('truetype'); font-weight: 700; }
        * { box-sizing: border-box; }
        @page { size: A4 landscape; margin: 9mm 8mm 10mm; }
        body { margin: 0; color: #19313a; background: #fff; font-family: Cairo, Arial, sans-serif; font-size: 10px; }
        .page { width: 100%; }
        .header { display: table; width: 100%; margin-bottom: 18px; padding: 15px 18px; color: #fff; background: linear-gradient(125deg, #07566a, #029cbe); border-radius: 14px; }
        .brand, .heading, .issue { display: table-cell; vertical-align: middle; }
        .brand { width: 118px; }
        .brand img { width: 98px; max-height: 58px; object-fit: contain; background: #fff; border-radius: 9px; padding: 5px; }
        .brand-mark { width: 92px; height: 52px; padding-top: 14px; border: 1px solid rgba(255,255,255,.38); border-radius: 9px; text-align: center; font-size: 19px; font-weight: 700; }
        .heading h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.3; }
        .heading p { margin: 0; color: #d9f8fb; font-size: 10px; }
        .issue { width: 175px; text-align: left; }
        .issue-label { display: block; color: #c5f2f8; font-size: 9px; }
        .issue strong { font-size: 10px; }
        .scope { margin: 0 0 16px; padding: 9px 12px; border-right: 4px solid #029cbe; border-radius: 6px; color: #4d6871; background: #f0fbfd; font-size: 9px; }
        .cards { display: table; width: 100%; margin-bottom: 18px; border-spacing: 7px 0; border-collapse: separate; }
        .card { display: table-cell; width: 25%; padding: 12px; border: 1px solid #dbe8eb; border-radius: 10px; background: #fff; }
        .card-label { display: block; margin-bottom: 6px; color: #607880; font-size: 9px; }
        .card-value { display: block; color: #12323b; font-size: 24px; font-weight: 700; line-height: 1.1; }
        .card-note { display: block; margin-top: 4px; color: #9aa9ad; font-size: 8px; }
        .section { margin-top: 16px; page-break-inside: auto; }
        .section-title { margin: 0 0 8px; padding: 8px 11px; border-right: 4px solid #029cbe; color: #12323b; background: #eef9fb; font-size: 12px; font-weight: 700; }
        .section-title small { margin-right: 8px; color: #698088; font-size: 8px; font-weight: 400; }
        table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th { padding: 9px 10px; color: #47636c; background: #f2f7f8; border: 1px solid #dfe9eb; font-size: 9px; text-align: right; }
        td { padding: 8px 10px; color: #304d56; border: 1px solid #e5edef; font-size: 9px; }
        tbody tr:nth-child(even) { background: #fbfefe; }
        .number { font-weight: 700; text-align: center; }
        .rate { direction: ltr; white-space: nowrap; }
        .bar { display: inline-block; width: 52px; height: 5px; margin-left: 6px; overflow: hidden; vertical-align: middle; border-radius: 999px; background: #e1edef; }
        .bar i { display: block; height: 100%; border-radius: inherit; background: #029cbe; }
        .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #dce8ea; color: #768a90; font-size: 8px; }
        .footer span:last-child { float: left; }
    </style>
</head>
<body>
@php
    $summary = $report['summary'];
    $from = $report['filters']['from'] ? \Carbon\Carbon::parse($report['filters']['from'])->locale('ar')->translatedFormat('d F Y') : null;
    $to = $report['filters']['to'] ? \Carbon\Carbon::parse($report['filters']['to'])->locale('ar')->translatedFormat('d F Y') : null;
    $period = $from || $to ? (($from ?? 'بداية الفترة') . ' — ' . ($to ?? 'تاريخ التقرير')) : 'منذ بداية المنصة وحتى تاريخ التقرير';
    $generatedAt = \Carbon\Carbon::parse($report['generated_at'])->locale('ar')->translatedFormat('d F Y، h:i A');
@endphp
<main class="page">
    <header class="header">
        <div class="brand">
            @if($logo)
                <img src="{{ $logo }}" alt="منصة أفق">
            @else
                <div class="brand-mark">أفق</div>
            @endif
        </div>
        <div class="heading">
            <h1>تقرير المستفيدين والإنجاز</h1>
            <p>تقرير إداري موحّد لأعداد المستفيدين وإتمام الدبلومات والمسارات</p>
        </div>
        <div class="issue">
            <span class="issue-label">تاريخ إصدار التقرير</span>
            <strong>{{ $generatedAt }}</strong>
        </div>
    </header>

    <p class="scope">فترة التقرير: {{ $period }} &nbsp; | &nbsp; {{ $report['filters']['period_definition'] }}</p>

    <section class="cards">
        <div class="card"><span class="card-label">إجمالي المستفيدين الفريدين</span><strong class="card-value">{{ number_format($summary['total_beneficiaries']) }}</strong><span class="card-note">يُحسب المستفيد مرة واحدة</span></div>
        <div class="card"><span class="card-label">أتموا أي مسار / مقرر</span><strong class="card-value">{{ number_format($summary['completed_any_course']) }}</strong><span class="card-note">إكمال مقرر واحد على الأقل</span></div>
        <div class="card"><span class="card-label">أتموا أي دبلومة</span><strong class="card-value">{{ number_format($summary['completed_any_diploma']) }}</strong><span class="card-note">استوفوا متطلبات الدبلومة</span></div>
        <div class="card"><span class="card-label">إجمالي المكتملين الفريدين</span><strong class="card-value">{{ number_format($summary['completed_any_learning_path']) }}</strong><span class="card-note">بدون تكرار بين المسارات</span></div>
    </section>

    <section class="section">
        <h2 class="section-title">أداء الدبلومات <small>تفصيل التسجيل والإكمال حسب كل دبلومة</small></h2>
        <table>
            <thead><tr><th>الدبلومة</th><th>المستفيدون</th><th>المكتملون</th><th>نسبة الإكمال</th></tr></thead>
            <tbody>
            @forelse($report['diplomas'] as $diploma)
                <tr>
                    <td>{{ $diploma['diploma_name'] }}</td>
                    <td class="number">{{ number_format($diploma['beneficiaries_count']) }}</td>
                    <td class="number">{{ number_format($diploma['completed_count']) }}</td>
                    <td class="rate"><span class="bar"><i style="width: {{ min(100, $diploma['completion_rate']) }}%"></i></span>{{ number_format($diploma['completion_rate'], 2) }}%</td>
                </tr>
            @empty
                <tr><td colspan="4">لا توجد بيانات ضمن نطاق التقرير.</td></tr>
            @endforelse
            </tbody>
        </table>
    </section>

    <section class="section">
        <h2 class="section-title">أداء المسارات والمقررات <small>تفاصيل الإنجاز الأكاديمي داخل كل دبلومة</small></h2>
        <table>
            <thead><tr><th>المسار / المقرر</th><th>الدبلومة</th><th>المستفيدون</th><th>المكتملون</th><th>نسبة الإكمال</th></tr></thead>
            <tbody>
            @forelse($report['courses'] as $course)
                <tr>
                    <td>{{ $course['course_name'] }}</td>
                    <td>{{ $course['diploma_name'] ?: '—' }}</td>
                    <td class="number">{{ number_format($course['beneficiaries_count']) }}</td>
                    <td class="number">{{ number_format($course['completed_count']) }}</td>
                    <td class="rate"><span class="bar"><i style="width: {{ min(100, $course['completion_rate']) }}%"></i></span>{{ number_format($course['completion_rate'], 2) }}%</td>
                </tr>
            @empty
                <tr><td colspan="5">لا توجد بيانات ضمن نطاق التقرير.</td></tr>
            @endforelse
            </tbody>
        </table>
    </section>

    <footer class="footer"><span>منصة أفق للتعليم عن بعد — تقرير إداري داخلي</span><span>تم توليده آليًا من سجلات المنصة</span></footer>
</main>
</body>
</html>
