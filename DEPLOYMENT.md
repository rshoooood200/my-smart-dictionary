# دليل نشر التطبيق على Vercel

## 📋 المتطلبات

1. حساب على [Vercel](https://vercel.com)
2. حساب على [Supabase](https://supabase.com) أو [Neon](https://neon.tech) لقاعدة البيانات
3. مستودع GitHub للتطبيق

---

## 🚀 الخطوات

### الخطوة 1: إنشاء قاعدة بيانات PostgreSQL

#### باستخدام Supabase (موصى به):
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى Settings → Database
4. انسخ Connection string (URI)
5. غير `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات

#### باستخدام Neon:
1. اذهب إلى [neon.tech](https://neon.tech)
2. أنشئ مشروع جديد
3. انسخ Connection string

---

### الخطوة 2: رفع الكود إلى GitHub

```bash
# إنشاء مستودع جديد على GitHub
# ثم:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

---

### الخطوة 3: نشر التطبيق على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط "New Project"
3. اختر مستودع GitHub
4. اضغط "Import"

---

### الخطوة 4: إعداد متغيرات البيئة

في صفحة إعدادات المشروع على Vercel، أضف المتغيرات التالية:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/database?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://user:password@host:5432/database` |
| `NEXTAUTH_SECRET` | (مفتاح عشوائي طويل) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

---

### الخطوة 5: إنشاء جداول قاعدة البيانات

بعد النشر الأول، شغل هذا الأمر محلياً:

```bash
# ثبت متغيرات البيئة الجديدة
npx prisma db push
```

أو استخدم Vercel CLI:

```bash
vercel env pull .env
npx prisma db push
```

---

## ⚠️ ملاحظات مهمة

1. **لا تستخدم SQLite** على Vercel - سيتم حذف البيانات مع كل نشر
2. **احتفظ بنسخة احتياطية** من بياناتك المحلية قبل النقل
3. **استخدم Connection Pooling** (pgbouncer) لتجنب مشاكل الاتصال

---

## 🔧 استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
- تأكد من صحة DATABASE_URL
- تأكد من أن قاعدة البيانات تسمح بالاتصالات الخارجية

### خطأ في Prisma
```bash
npx prisma generate
npx prisma db push
```

### خطأ في البناء
- تحقق من سجلات Vercel
- تأكد من أن جميع المتغيرات مضبوط

---

## 📞 الدعم

إذا واجهت أي مشاكل، راجع:
- [توثيق Vercel](https://vercel.com/docs)
- [توثيق Prisma](https://www.prisma.io/docs)
- [توثيق Supabase](https://supabase.com/docs)
