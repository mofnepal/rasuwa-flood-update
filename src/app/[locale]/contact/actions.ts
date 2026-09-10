'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';
import { rateLimit, sweepRateLimits } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(4).max(160),
  subject: z.string().trim().min(1).max(80),
  body: z.string().trim().min(5).max(4000),
  // Honeypot: a real person never fills this in.
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactState = { status: 'idle' | 'sent' | 'error'; message?: string };

/**
 * Stores a coordination message and emails the portal officer.
 * The form never handles contributions — those go through donate.gov.np.
 */
export async function submitMessage(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    contact: formData.get('contact'),
    subject: formData.get('subject'),
    body: formData.get('body'),
    website: formData.get('website') ?? '',
  });
  if (!parsed.success) return { status: 'error' };
  if (parsed.data.website) return { status: 'sent' }; // silently drop the bot

  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    'unknown';

  sweepRateLimits();
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { status: 'error' };

  await prisma.message.create({
    data: {
      name: parsed.data.name,
      contact: parsed.data.contact,
      subject: parsed.data.subject,
      body: parsed.data.body,
      ip,
    },
  });

  if (process.env.SMTP_HOST && process.env.CONTACT_TO) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });
      await transport.sendMail({
        from: process.env.CONTACT_FROM ?? 'rasuwa-flood@mof.gov.np',
        to: process.env.CONTACT_TO,
        subject: `[rasuwa-flood] ${parsed.data.subject} — ${parsed.data.name}`,
        text: `${parsed.data.name}\n${parsed.data.contact}\n\n${parsed.data.body}`,
      });
    } catch {
      // The message is already stored; delivery failure must not lose it.
    }
  }

  return { status: 'sent' };
}
