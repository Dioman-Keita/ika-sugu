type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmailWithResend(args: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const from = args.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }
  if (!isValidFrom(from)) {
    throw new Error(
      "RESEND_FROM_EMAIL must be in the format `email@example.com` or `Name <email@example.com>`",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${res.statusText} ${text}`.trim());
  }
}

function isValidFrom(value: string): boolean {
  const v = value.trim();
  const simpleEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const namedEmail = /^[^<>]+<[^@\s]+@[^@\s]+\.[^@\s]+>$/;
  return simpleEmail.test(v) || namedEmail.test(v);
}
