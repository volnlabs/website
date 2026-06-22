import type { APIRoute } from 'astro';
import { Resend, type CreateEmailOptions } from 'resend';

import { handleContactRequest } from '../../lib/contact.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const resend = apiKey ? new Resend(apiKey) : null;

  return handleContactRequest(request, {
    configured: Boolean(resend),
    sendEmail: resend
      ? (email: CreateEmailOptions) => resend.emails.send(email)
      : undefined,
  });
};

export const ALL: APIRoute = async ({ request }) =>
  handleContactRequest(request, { configured: false });
