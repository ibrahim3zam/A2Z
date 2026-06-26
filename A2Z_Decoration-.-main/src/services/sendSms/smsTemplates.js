/**
 * قالب رسالة الـ OTP للأدمن
 * @param {string} otp - رمز التحقق
 * @}
 */
export const adminOtpTemplate = (otp) => {
  return `🔑 A2Z Decoration\n\nYour Admin Login OTP is: ${otp}\n\nValid for 5 minutes. Please do not share this code.`;
};

/**
 * يمكنك إضافة قوالب أخرى مستقبلاً هنا (مثال: تأكيد الطلب للعميل)
 */
export const orderConfirmationTemplate = (orderId, customerName) => {
  return `Dear ${customerName}, your order #${orderId} at A2Z Decoration has been confirmed successfully!`;
};