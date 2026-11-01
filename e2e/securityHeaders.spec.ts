import { expect, test } from './fixtures';

const expectedHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'content-security-policy': "frame-ancestors 'none'",
};

for (const path of ['/', '/calculadora-rescisao', '/privacidade']) {
  test(`${path} responde com os headers de segurança`, async ({ request }) => {
    const response = await request.get(path);
    const headers = response.headers();

    for (const [name, value] of Object.entries(expectedHeaders)) expect(headers[name], name).toBe(value);
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['x-powered-by'], 'não revela a tecnologia do servidor').toBeUndefined();
  });
}
