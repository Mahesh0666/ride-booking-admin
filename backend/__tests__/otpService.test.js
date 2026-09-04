const devProvider = require('../src/services/otpProviders/dev');
const msg91Provider = require('../src/services/otpProviders/msg91');
const { normalizePhone } = require('../src/services/otpService');

describe('dev OTP provider', () => {
  test('generates a secure numeric OTP of configured length', async () => {
    const result = await devProvider.sendOtp({ phone: '9876543210', length: 6 });
    expect(result.reference).toMatch(/^[0-9a-f]{64}$/);
  });

  test('does not return the plaintext OTP in send result', async () => {
    const result = await devProvider.sendOtp({ phone: '9876543210', length: 6 });
    expect(result).not.toHaveProperty('devOtp');
    expect(result).toHaveProperty('reference');
  });

  test('verifies a correct OTP via HMAC reference', async () => {
    const crypto = require('crypto');
    const config = require('../src/config/config');
    const knownOtp = '123456';
    const reference = crypto.createHmac('sha256', config.jwtSecret).update(knownOtp).digest('hex');
    const result = await devProvider.verifyOtp({ phone: '9876543210', otp: knownOtp, reference });
    expect(result.verified).toBe(true);
  });

  test('rejects an incorrect OTP', async () => {
    expect(await devProvider.verifyOtp({ phone: '9876543210', otp: '000000', reference: 'x'.repeat(64) })).toMatchObject({
      verified: false,
    });
  });
});

describe('msg91 provider', () => {
  test('masks phone numbers to first 2 + last 2 digits', () => {
    expect(msg91Provider.maskPhone('9876543210')).toBe('98****10');
  });

  test('converts phone to E.164 with configured country code', () => {
    expect(msg91Provider.toE164('9876543210')).toBe('919876543210');
  });
});

describe('otpService helpers', () => {
  test('normalizes phone to digits only', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('919876543210');
    expect(normalizePhone('98765-43210')).toBe('9876543210');
  });
});