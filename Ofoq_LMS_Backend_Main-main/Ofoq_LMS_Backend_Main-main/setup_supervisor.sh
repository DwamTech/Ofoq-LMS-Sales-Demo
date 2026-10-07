#!/bin/bash

# سكريبت تثبيت وتكوين Supervisor لـ Queue Workers
# Supervisor Setup Script for Queue Workers

echo "🔧 إعداد Supervisor لـ Queue Workers"
echo "========================================"
echo ""

# التحقق من تثبيت Supervisor
if ! command -v supervisorctl &> /dev/null; then
    echo "❌ Supervisor غير مثبت"
    echo "📦 تثبيت Supervisor..."
    sudo apt update
    sudo apt install -y supervisor
    echo "✓ تم تثبيت Supervisor"
else
    echo "✓ Supervisor مثبت بالفعل"
fi

echo ""
echo "📝 نسخ ملف التكوين..."

# نسخ ملف التكوين
sudo cp ofuq-queue-worker.conf /etc/supervisor/conf.d/

echo "✓ تم نسخ ملف التكوين"
echo ""

echo "🔄 تحديث Supervisor..."

# تحديث Supervisor
sudo supervisorctl reread
sudo supervisorctl update

echo "✓ تم تحديث Supervisor"
echo ""

echo "▶️  تشغيل Queue Workers..."

# تشغيل Workers
sudo supervisorctl start ofuq-queue-worker:*

echo "✓ تم تشغيل Queue Workers"
echo ""

echo "📊 حالة Queue Workers:"
echo "----------------------------------------"
sudo supervisorctl status ofuq-queue-worker:*

echo ""
echo "========================================"
echo "✅ تم إعداد Supervisor بنجاح!"
echo ""
echo "📝 أوامر مفيدة:"
echo "   sudo supervisorctl status ofuq-queue-worker:*    # عرض الحالة"
echo "   sudo supervisorctl restart ofuq-queue-worker:*   # إعادة التشغيل"
echo "   sudo supervisorctl stop ofuq-queue-worker:*      # إيقاف"
echo "   sudo supervisorctl tail ofuq-queue-worker:*      # عرض السجلات"
echo ""
