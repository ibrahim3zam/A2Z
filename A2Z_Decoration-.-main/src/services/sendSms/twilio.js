import twilio from 'twilio';

/**
 * دالة مساعدة لإرسال رسائل SMS عبر Twilio مع تحويل الأرقام المحلية تلقائياً
 * @param {string} to - رقم هاتف المستلم (سواء محلي 010... أو دولي +2010...)
 * @param {string} message - نص الرسالة المراد إرسالها
 * @returns {Promise<object>} - استجابة سيرفر تويليو في حال النجاح
 */
export const sendSMS = async (to, message) => {
  try {
    if (!to || !message) {
      throw new Error("Missing 'to' or 'message' arguments in sendSMS function");
    }

    let formattedNumber = to.trim();

    // 👈 إذا كان الرقم مكتوباً بالصيغة المحلية المصرية (01xxxxxxxxx)
    // نقوم بحذف الصفر الأول واستبداله بمفتاح الدولة الدولي (+20)
    if (formattedNumber.startsWith('01')) {
      formattedNumber = `+20${formattedNumber.substring(1)}`;
    }

    // جلب بيانات الحساب داخل الدالة لضمان قراءتها من الـ .env بنجاح وقت التنفيذ
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials (SID or Token) are missing in process.env");
    }

    // إنشاء عميل تويليو (Lazy Initialization)
    const client = twilio(accountSid, authToken);

    // تنفيذ طلب الإرسال السحابي
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // رقم تويليو الأمريكي التجريبي المكتوب في الـ .env
      to: formattedNumber,                  // الرقم الدولي المنسق (+2010...)
    });

    return response;
  } catch (error) {
    // طباعة الخطأ بوضوح في الـ Terminal الخاص بالسيرفر لمعرفته فوراً
    console.error('❌ Twilio Integration Error:', error.message);
    
    // تمرير الخطأ للـ global error handler الخاص بالمشروع
    throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
  }
};