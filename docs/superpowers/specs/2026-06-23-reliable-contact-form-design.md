# Reliable Contact Form Design

## Goal

Replace the current `mailto:` handoff with a contact form that submits from the
website, delivers through Resend, works on mobile, and gives the visitor a clear
success or failure result.

## Architecture

The existing Astro site remains statically generated. A single on-demand API
route, `POST /api/contact`, runs as a Vercel function through the existing
`@astrojs/vercel` adapter. The browser never receives the Resend API key.

The API route sends one email through Resend:

- From: `VolnLabs Contact Form <contact@volnlabs.com>`
- To: `research@volnlabs.com`
- Reply-To: the visitor's validated email address
- Subject: `Collaboration inquiry from <name>`
- Body: visitor name, email, organization, and message

`RESEND_API_KEY` is read only from the Vercel environment. It must not be stored
in the repository or exposed through a public environment variable.

## Form Contract

The browser sends JSON to `/api/contact` with:

- `name`: required, trimmed, 2–100 characters
- `email`: required, trimmed, syntactically valid, at most 254 characters
- `organization`: optional, trimmed, at most 150 characters
- `message`: required, trimmed, 10–5,000 characters
- `company`: hidden honeypot field that must remain empty

The API responds with JSON:

- `200 { "ok": true }` after Resend accepts the email
- `400 { "ok": false, "error": "<safe validation message>" }` for invalid input
- `403 { "ok": false, "error": "Unable to submit this form." }` for a failed
  same-origin check or populated honeypot
- `405` for unsupported methods
- `500 { "ok": false, "error": "We could not send your message. Please email research@volnlabs.com directly." }`
  when configuration or delivery fails

The server logs delivery failures without logging the full submitted message.

## Browser Behavior

The existing visual design remains, with these functional changes:

1. Required fields use native browser constraints and accessible labels.
2. Submission uses `fetch()` with JSON instead of changing location to a
   `mailto:` URL.
3. While sending, the button is disabled and displays `Sending…`.
4. On success, the form is reset and an `aria-live` status displays a
   confirmation.
5. On failure, an `aria-live` status displays the server's safe error and keeps
   the entered values for retry.
6. The direct `research@volnlabs.com` mail link remains as a fallback.
7. Responsive CSS collapses the contact page and name/email fields to one
   column on narrow viewports so the form is not clipped.

## Spam and Abuse Controls

The initial implementation uses controls that require no additional service:

- same-origin request validation
- JSON content-type enforcement
- a hidden honeypot
- strict field validation and maximum lengths
- no user-controlled sender address

These controls reduce automated abuse but are not durable rate limiting. If
production traffic shows abuse, a challenge service or shared rate-limit store
can be added later without changing the public form fields.

## Code Boundaries

- `src/lib/contact.js`: input normalization, validation, email payload
  construction, and a dependency-injected request handler
- `src/pages/api/contact.ts`: Astro/Vercel route that reads the environment,
  initializes Resend, and delegates to the handler
- `src/pages/contact.astro`: responsive form markup and browser submission state
- `test/contact.test.js`: Node tests for validation, abuse rejection, successful
  delivery payloads, and provider failures
- `package.json`: test script and Resend dependency

Keeping validation and request handling independent of Astro and Resend makes
the behavior testable without network calls or real email delivery.

## Testing

Automated tests cover:

- valid input produces the fixed sender, destination, reply-to, and full body
- required and malformed fields are rejected
- inputs are trimmed and bounded
- the honeypot and cross-origin requests are rejected
- provider failure returns the safe fallback response
- the API key is never returned to the browser

Verification also includes:

- the full test command
- `npm run build`
- local browser checks at desktop and mobile widths
- one production smoke submission after deployment, confirmed both in the
  Resend logs and the `research@volnlabs.com` inbox

The production smoke test is performed manually after deployment because it
uses the real secret and sends an actual email.

## Provider References

- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
