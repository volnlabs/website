export const DELIVERY_ERROR =
  'We could not send your message. Please email research@volnlabs.com directly.';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
  });
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasLineBreak(value) {
  return /[\r\n]/.test(value);
}

export function validateContactInput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid form submission.' };
  }

  const name = stringValue(raw.name);
  const email = stringValue(raw.email);
  const organization = stringValue(raw.organization);
  const message = stringValue(raw.message);

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (name.length < 2) {
    return { ok: false, error: 'Name must be at least 2 characters.' };
  }
  if (name.length > 100) {
    return { ok: false, error: 'Name must be 100 characters or fewer.' };
  }
  if (hasLineBreak(name)) {
    return { ok: false, error: 'Name must be a single line.' };
  }

  if (!email) return { ok: false, error: 'Please enter your email address.' };
  if (email.length > 254) {
    return { ok: false, error: 'Email must be 254 characters or fewer.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (organization.length > 150) {
    return {
      ok: false,
      error: 'Organization must be 150 characters or fewer.',
    };
  }
  if (hasLineBreak(organization)) {
    return { ok: false, error: 'Organization must be a single line.' };
  }

  if (!message) return { ok: false, error: 'Please enter a message.' };
  if (message.length < 10) {
    return { ok: false, error: 'Message must be at least 10 characters.' };
  }
  if (message.length > 5000) {
    return { ok: false, error: 'Message must be 5000 characters or fewer.' };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      organization,
      message,
    },
  };
}

export function buildContactEmail(input) {
  return {
    from: 'VolnLabs Contact Form <contact@volnlabs.com>',
    to: ['research@volnlabs.com'],
    replyTo: input.email,
    subject: `Collaboration inquiry from ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Organization: ${input.organization || 'Not provided'}`,
      '',
      'Message:',
      input.message,
    ].join('\n'),
  };
}

export async function handleContactRequest(request, {
  sendEmail,
  configured = true,
  logger = console,
} = {}) {
  if (request.method !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      error: 'Method not allowed.',
    }, {
      allow: 'POST',
    });
  }

  const requestOrigin = new URL(request.url).origin;
  if (request.headers.get('origin') !== requestOrigin) {
    return jsonResponse(403, {
      ok: false,
      error: 'Unable to submit this form.',
    });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse(400, {
      ok: false,
      error: 'Invalid form submission.',
    });
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(400, {
      ok: false,
      error: 'Invalid form submission.',
    });
  }

  if (stringValue(raw?.company)) {
    return jsonResponse(403, {
      ok: false,
      error: 'Unable to submit this form.',
    });
  }

  const validation = validateContactInput(raw);
  if (!validation.ok) {
    return jsonResponse(400, {
      ok: false,
      error: validation.error,
    });
  }

  if (!configured || typeof sendEmail !== 'function') {
    logger.error('Contact email delivery is not configured.');
    return jsonResponse(500, {
      ok: false,
      error: DELIVERY_ERROR,
    });
  }

  try {
    const result = await sendEmail(buildContactEmail(validation.value));
    if (result?.error) {
      logger.error('Contact email provider rejected the request.', result.error);
      return jsonResponse(500, {
        ok: false,
        error: DELIVERY_ERROR,
      });
    }
  } catch (error) {
    logger.error('Contact email provider request failed.', error);
    return jsonResponse(500, {
      ok: false,
      error: DELIVERY_ERROR,
    });
  }

  return jsonResponse(200, { ok: true });
}
