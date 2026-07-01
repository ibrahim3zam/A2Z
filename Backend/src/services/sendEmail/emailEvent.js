import { EventEmitter } from 'events';
import { sendEmail } from './sendEmail.js';
import { customAlphabet } from 'nanoid';

export const emailEvent = new EventEmitter();
export const generateOtp = customAlphabet('0123456789', 6);

emailEvent.on('sendEmail', async (data) => {
  try {
    const { to, subject, html } = data;

    console.log(`Processing email event for: ${to}...`);

    await sendEmail({ to, subject, html });
  } catch (error) {
    console.error('Error processing email event:', error);
  }
});

emailEvent.on('sendPasswordOtp', async (data) => {
  try {
    const { to, subject, html } = data;
    console.log(`Processing email event for: ${to}...`);

    await sendEmail({ to, subject, html });
  } catch (error) {
    console.error('Error processing email event:', error);
  }
});
