export const LEGAL_VERSION = '1.0.0';
export const LEGAL_UPDATED = '18 August 2026';
export const SUPPORT_EMAIL = 'maheshbabuv57@gmail.com';

export interface LegalSection {
  title: string;
  body: string;
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By creating an account or using Ride-Book, you agree to these Terms & Conditions, our Privacy Policy, and all applicable laws. If you do not agree, do not use the service.',
  },
  {
    title: '2. The Service',
    body:
      'Ride-Book connects you with verified drivers for on-demand and scheduled rides. We display estimated fares, provide live ride tracking, OTP-based ride start for safety, and payment settlement between you and the driver.',
  },
  {
    title: '3. Your Data — Used Only to Serve You',
    body:
      'We collect only the information needed to provide our service: your name, phone number, ride locations, and journey history. Your location is used ONLY to arrange, track, and complete your rides — never tracked in the background. ' +
      'We never sell your personal data, never share it for advertising, and you can delete your data at any time by contacting support.',
  },
  {
    title: '4. Accounts & Safety',
    body:
      'You must provide accurate information, keep your OTP private, and treat drivers with respect. Do not request a ride for someone else without consent, and do not use the app for any unlawful purpose.',
  },
  {
    title: '5. Fares & Payments',
    body:
      'Fares are estimates based on distance, duration, and locally applicable minimums. Your final fare is shown before you start the ride. Payments settle at the end of the ride; contact support for fare disputes.',
  },
  {
    title: '6. Cancellations',
    body:
      'You may cancel before pickup. Frequent cancellations after a driver is assigned may affect your access to the service.',
  },
  {
    title: '7. Acceptable Use & Liability',
    body:
      'Ride-Book facilitates rides between you and drivers. To the fullest extent permitted by law, Ride-Book is not liable for indirect or consequential losses. You are responsible for your conduct during travel.',
  },
  {
    title: '8. Changes & Contact',
    body:
      'We may update these Terms, and will notify you of material changes. Questions? Contact us at ' + SUPPORT_EMAIL + '.',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Information We Collect',
    body:
      'Account details (name, phone), ride request details (pickup/dropoff addresses, route, timing), and device/crash diagnostics needed to operate and improve the service.',
  },
  {
    title: 'How We Use Your Information',
    body:
      'We use it exclusively to: match you with drivers, quote fares, provide navigation and tracking, complete payments, ensure safety (OTP verification, SOS), and provide support. We do NOT use your data for advertising, profiling, or resale.',
  },
  {
    title: 'Location & Permissions',
    body:
      'We ask for your location ONLY when you explicitly choose to use the current location for a ride. Your location is never collected in the background. You can revoke location permission any time in your device settings.',
  },
  {
    title: 'Sharing',
    body:
      'We share only what is required to complete your ride (pickup/dropoff and live ride status) with the matched driver, and with service providers who help us operate (payments, maps). No third-party marketing sharing.',
  },
  {
    title: 'Security',
    body:
      'Your data is transmitted over encrypted connections and stored securely. Access is limited to staff who need it to operate the service.',
  },
  {
    title: 'Retention & Deletion',
    body:
      'We keep ride records only as long as required. You may request a copy of your data or its deletion at any time at ' + SUPPORT_EMAIL + '.',
  },
  {
    title: 'Your Rights & Contact',
    body:
      'You can access, correct, or delete your personal data, and object to processing. To exercise these rights, email ' + SUPPORT_EMAIL + '.',
  },
];

export const DATA_USAGE_NOTE = {
  title: 'We use your data only to serve you',
  body:
    'Ride-Book collects and uses your data only to provide and improve your ride experience — matching you with drivers, quoting fares, live tracking, and safe OTP-verified pickups. Your location is only used when you book a ride, and never in the background. We never sell or share your data for advertising.',
};