# Reliable Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the contact page's `mailto:` submission with a validated Resend-backed Vercel endpoint and an accessible, responsive browser form.

**Architecture:** Keep all existing pages statically generated and mark only `src/pages/api/contact.ts` for on-demand rendering. Put validation and provider-independent request handling in `src/lib/contact.js`, then inject Resend from the Astro API route so tests never send real email.

**Tech Stack:** Astro 7, Vercel adapter, Resend 6, Node.js built-in test runner, browser Fetch API

---

### Task 1: Test and implement the contact request core

**Files:**
- Create: `test/contact.test.js`
- Create: `src/lib/contact.js`
- Modify: `package.json`

- [ ] **Step 1: Add failing tests for successful delivery**

Create `test/contact.test.js` with a `Request` helper and a test that calls
`handleContactRequest()` using valid JSON and a fake `sendEmail`. Assert status
`200`, `{ ok: true }`, and this provider payload:

```js
{
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
}
```

- [ ] **Step 2: Add failing tests for rejection paths**

Cover malformed JSON, non-JSON content, mismatched or missing Origin, populated
`company`, missing/short/overlong fields, malformed email, unconfigured email,
provider `{ error }`, and a thrown provider error. Assert safe `400`, `403`, or
`500` JSON responses and that `sendEmail` is not called for rejected input.

- [ ] **Step 3: Run the test and verify RED**

Run: `node --test test/contact.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/contact.js`.

- [ ] **Step 4: Implement the minimal contact core**

Create `src/lib/contact.js` exporting:

```js
export const DELIVERY_ERROR =
  'We could not send your message. Please email research@volnlabs.com directly.';

export function validateContactInput(raw) {
  // Return { ok: false, error } for invalid input.
  // Return { ok: true, value: { name, email, organization, message } } after
  // trimming strings and enforcing the design's lengths and single-line fields.
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
  // Enforce POST, same origin, application/json, valid JSON, honeypot, and field
  // validation. Call sendEmail(buildContactEmail(value)); treat thrown errors and
  // returned { error } as delivery failures. Return JSON Response objects.
}
```

Do not include the submitted message or API key in logs or responses.

- [ ] **Step 5: Add the test script**

Modify `package.json`:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "node --test",
  "astro": "astro"
}
```

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test`

Expected: all contact tests pass with zero failures.

- [ ] **Step 7: Commit the tested core**

```bash
git add package.json src/lib/contact.js test/contact.test.js
git commit -m "feat: validate contact submissions"
```

### Task 2: Add the Resend-backed Astro endpoint

**Files:**
- Create: `src/pages/api/contact.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the current Resend SDK**

Run: `npm install resend@^6.14.0`

Expected: `resend` appears under dependencies and the lockfile updates.

- [ ] **Step 2: Add the on-demand API route**

Create `src/pages/api/contact.ts`:

```ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { handleContactRequest } from '../../lib/contact.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = process.env.RESEND_API_KEY;

  return handleContactRequest(request, {
    configured: Boolean(apiKey),
    sendEmail: apiKey
      ? (email) => new Resend(apiKey).emails.send(email)
      : undefined,
  });
};

export const ALL: APIRoute = async ({ request }) =>
  handleContactRequest(request, { configured: false });
```

The `ALL` path returns `405` before configuration is inspected because the core
checks the method first.

- [ ] **Step 3: Verify the server route builds**

Run: `npm test && npm run build`

Expected: tests pass; Astro reports `/api/contact` as an on-demand route and
the build exits `0`.

- [ ] **Step 4: Commit the endpoint**

```bash
git add package.json package-lock.json src/pages/api/contact.ts
git commit -m "feat: send contact email through Resend"
```

### Task 3: Wire the responsive contact form to the endpoint

**Files:**
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: Replace inline layout hooks with responsive classes**

Add `contact-grid`, `form-card`, `name-email-grid`, and `direct-email` classes.
At `max-width: 760px`, make both grids one column, reduce card padding, allow the
email CTA to wrap, and ensure every item has `min-width: 0`.

- [ ] **Step 2: Add accessible field constraints and spam field**

Use `name` attributes and these constraints:

```html
<input name="name" required minlength="2" maxlength="100">
<input name="email" type="email" required maxlength="254">
<input name="organization" maxlength="150">
<textarea name="message" required minlength="10" maxlength="5000"></textarea>
<input name="company" tabindex="-1" autocomplete="off">
```

Place `company` in a visually hidden, `aria-hidden="true"` honeypot wrapper.
Add `<p id="form-status" role="status" aria-live="polite"></p>`.

- [ ] **Step 3: Replace the mailto submit script**

On submit, disable the button, show `Sending…`, POST `Object.fromEntries(new
FormData(form))` as JSON to `/api/contact`, parse the safe JSON response, reset
on success, preserve values on error, update the live status, and restore the
button in `finally`. Keep the direct mailto link as fallback.

- [ ] **Step 4: Verify static output contains the contract**

Run:

```bash
npm test
npm run build
rg -n 'api/contact|form-status|name="company"|required|maxlength="5000"' dist/contact/index.html
```

Expected: tests and build pass; all four form contract markers are present.

- [ ] **Step 5: Commit the browser form**

```bash
git add src/pages/contact.astro
git commit -m "feat: submit contact form from website"
```

### Task 4: End-to-end local verification

**Files:**
- No production file changes expected

- [ ] **Step 1: Start Astro dev with a harmless local test key**

Run: `RESEND_API_KEY=re_test npm run dev -- --host 127.0.0.1`

Expected: local server starts and `/contact` renders.

- [ ] **Step 2: Verify server-side rejection without sending email**

POST invalid input with `Origin: http://127.0.0.1:4321`.

Expected: HTTP `400` and a safe validation error, proving the dynamic endpoint
executes before any Resend request.

- [ ] **Step 3: Capture desktop and mobile screenshots**

Use headless Chromium at `1440x1000` and `390x844`.

Expected: the desktop design remains intact and the mobile form is fully within
the viewport in a single column.

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: zero test failures, build exit `0`, no whitespace errors, and only
intentional plan/status changes if any.

- [ ] **Step 5: Document deployment smoke test**

After this branch is integrated and Vercel deploys it, submit one real message
from `https://www.volnlabs.com/contact`. Confirm the message appears in Resend
Logs and arrives at `research@volnlabs.com`; clicking Reply must target the
visitor's submitted email.
