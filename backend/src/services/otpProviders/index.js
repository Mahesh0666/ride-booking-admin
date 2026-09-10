const config = require('../../config/config');
const msg91 = require('./msg91');
const dev = require('./dev');
const twilio = require('./twilio');

const PROVIDERS = { msg91, dev, twilio };

const getProvider = () => {
  const provider = PROVIDERS[config.otp.provider];
  if (!provider) {
    throw new Error(`Unsupported OTP_PROVIDER "${config.otp.provider}". Use "msg91", "twilio", or "dev".`);
  }
  if (config.isProduction && config.otp.provider === 'dev') {
    throw new Error('The "dev" OTP provider cannot be used in production. Set OTP_PROVIDER=twilio.');
  }
  return provider;
};

module.exports = {
  getProvider,
  maskPhone: (phone) => {
    const provider = getProvider();
    return provider.maskPhone ? provider.maskPhone(phone) : '***';
  },
  toE164: (phone) => getProvider().toE164(phone),
};