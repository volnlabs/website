import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DELIVERY_ERROR,
  handleContactRequest,
  validateContactInput,
} from '../src/lib/contact.js';

const validSubmission = {
  name: 'Ada Lovelace',
  email: 'ada@lab.edu',
  organization: 'Analytical Engines',
  message: 'I would like to discuss adaptive systems.',
  company: '',
};

function makeRequest(body = validSubmission, {
  method = 'POST',
  origin = 'https://www.volnlabs.com',
  contentType = 'application/json',
  rawBody,
} = {}) {
  const headers = new Headers();
  if (origin !== null) headers.set('origin', origin);
  if (contentType !== null) headers.set('content-type', contentType);

  return new Request('https://www.volnlabs.com/api/contact', {
    method,
    headers,
    body: method === 'GET'
      ? undefined
      : rawBody ?? JSON.stringify(body),
  });
}

async function readJson(response) {
  return response.json();
}

test('delivers a valid contact submission with a fixed sender and visitor reply-to', async () => {
  const sent = [];
  const response = await handleContactRequest(makeRequest(), {
    sendEmail: async (email) => {
      sent.push(email);
      return { data: { id: 'email_123' }, error: null };
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { ok: true });
  assert.deepEqual(sent, [{
    from: 'VolnLabs Contact Form <contact@volnlabs.com>',
    to: ['research@volnlabs.com'],
    replyTo: 'ada@lab.edu',
    subject: 'Collaboration inquiry from Ada Lovelace',
    text: [
      'Name: Ada Lovelace',
      'Email: ada@lab.edu',
      'Organization: Analytical Engines',
      '',
      'Message:',
      'I would like to discuss adaptive systems.',
    ].join('\n'),
  }]);
});

test('trims submitted fields before delivery', async () => {
  const sent = [];
  const response = await handleContactRequest(makeRequest({
    name: '  Ada Lovelace  ',
    email: '  ada@lab.edu  ',
    organization: '  Analytical Engines  ',
    message: '  A sufficiently detailed message.  ',
    company: '',
  }), {
    sendEmail: async (email) => {
      sent.push(email);
      return { data: { id: 'email_123' }, error: null };
    },
  });

  assert.equal(response.status, 200);
  assert.equal(sent[0].replyTo, 'ada@lab.edu');
  assert.match(sent[0].text, /^Name: Ada Lovelace$/m);
  assert.match(sent[0].text, /^Organization: Analytical Engines$/m);
  assert.match(sent[0].text, /A sufficiently detailed message\.$/);
});

test('uses a clear fallback when organization is omitted', async () => {
  const sent = [];
  const response = await handleContactRequest(makeRequest({
    ...validSubmission,
    organization: '',
  }), {
    sendEmail: async (email) => {
      sent.push(email);
      return { data: { id: 'email_123' }, error: null };
    },
  });

  assert.equal(response.status, 200);
  assert.match(sent[0].text, /^Organization: Not provided$/m);
});

test('rejects unsupported methods before checking configuration', async () => {
  const response = await handleContactRequest(makeRequest(undefined, {
    method: 'GET',
  }), {
    configured: false,
  });

  assert.equal(response.status, 405);
  assert.deepEqual(await readJson(response), {
    ok: false,
    error: 'Method not allowed.',
  });
  assert.equal(response.headers.get('allow'), 'POST');
});

test('rejects requests without a matching origin', async () => {
  for (const origin of [null, 'https://attacker.example']) {
    let calls = 0;
    const response = await handleContactRequest(makeRequest(validSubmission, {
      origin,
    }), {
      sendEmail: async () => {
        calls += 1;
      },
    });

    assert.equal(response.status, 403);
    assert.deepEqual(await readJson(response), {
      ok: false,
      error: 'Unable to submit this form.',
    });
    assert.equal(calls, 0);
  }
});

test('rejects non-JSON and malformed JSON requests', async () => {
  const nonJson = await handleContactRequest(makeRequest(validSubmission, {
    contentType: 'text/plain',
  }), {
    sendEmail: async () => assert.fail('email must not be sent'),
  });
  assert.equal(nonJson.status, 400);

  const malformed = await handleContactRequest(makeRequest(validSubmission, {
    rawBody: '{',
  }), {
    sendEmail: async () => assert.fail('email must not be sent'),
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await readJson(malformed), {
    ok: false,
    error: 'Invalid form submission.',
  });
});

test('rejects lookalike JSON content types', async () => {
  let calls = 0;
  const response = await handleContactRequest(makeRequest(validSubmission, {
    contentType: 'application/jsonp',
  }), {
    sendEmail: async () => {
      calls += 1;
    },
  });

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test('rejects oversized request bodies before delivery', async () => {
  let calls = 0;
  const response = await handleContactRequest(makeRequest({
    ...validSubmission,
    padding: 'x'.repeat(20_000),
  }), {
    sendEmail: async () => {
      calls += 1;
    },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    ok: false,
    error: 'Invalid form submission.',
  });
  assert.equal(calls, 0);
});

test('rejects a populated honeypot without sending email', async () => {
  let calls = 0;
  const response = await handleContactRequest(makeRequest({
    ...validSubmission,
    company: 'Spam Incorporated',
  }), {
    sendEmail: async () => {
      calls += 1;
    },
  });

  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test('validates required fields, formats, limits, and single-line fields', () => {
  const cases = [
    [{ ...validSubmission, name: '' }, 'Please enter your name.'],
    [{ ...validSubmission, name: 'A' }, 'Name must be at least 2 characters.'],
    [{ ...validSubmission, name: 'A'.repeat(101) }, 'Name must be 100 characters or fewer.'],
    [{ ...validSubmission, name: 'Ada\nLovelace' }, 'Name must be a single line.'],
    [{ ...validSubmission, email: '' }, 'Please enter your email address.'],
    [{ ...validSubmission, email: 'not-an-email' }, 'Please enter a valid email address.'],
    [{ ...validSubmission, email: `${'a'.repeat(247)}@lab.edu` }, 'Email must be 254 characters or fewer.'],
    [{ ...validSubmission, organization: 'A'.repeat(151) }, 'Organization must be 150 characters or fewer.'],
    [{ ...validSubmission, organization: 'Lab\nTwo' }, 'Organization must be a single line.'],
    [{ ...validSubmission, message: '' }, 'Please enter a message.'],
    [{ ...validSubmission, message: 'Too short' }, 'Message must be at least 10 characters.'],
    [{ ...validSubmission, message: 'A'.repeat(5001) }, 'Message must be 5000 characters or fewer.'],
  ];

  for (const [input, error] of cases) {
    assert.deepEqual(validateContactInput(input), { ok: false, error });
  }
});

test('rejects non-object submissions', () => {
  assert.deepEqual(validateContactInput(null), {
    ok: false,
    error: 'Invalid form submission.',
  });
  assert.deepEqual(validateContactInput([]), {
    ok: false,
    error: 'Invalid form submission.',
  });
});

test('returns a safe error when email delivery is not configured', async () => {
  const response = await handleContactRequest(makeRequest(), {
    configured: false,
    logger: { error: () => {} },
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await readJson(response), {
    ok: false,
    error: DELIVERY_ERROR,
  });
});

test('returns a safe error when the provider reports an error', async () => {
  const logged = [];
  const response = await handleContactRequest(makeRequest(), {
    sendEmail: async () => ({
      data: null,
      error: { name: 'validation_error', message: 'provider details' },
    }),
    logger: {
      error: (...args) => logged.push(args),
    },
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await readJson(response), {
    ok: false,
    error: DELIVERY_ERROR,
  });
  assert.equal(logged.length, 1);
  assert.doesNotMatch(JSON.stringify(logged), /adaptive systems/);
});

test('returns a safe error when the provider throws', async () => {
  const logged = [];
  const response = await handleContactRequest(makeRequest(), {
    sendEmail: async () => {
      throw new Error('secret provider failure');
    },
    logger: {
      error: (...args) => logged.push(args),
    },
  });

  assert.equal(response.status, 500);
  const body = await readJson(response);
  assert.deepEqual(body, {
    ok: false,
    error: DELIVERY_ERROR,
  });
  assert.equal(logged.length, 1);
  assert.doesNotMatch(JSON.stringify(body), /secret provider failure/);
});
