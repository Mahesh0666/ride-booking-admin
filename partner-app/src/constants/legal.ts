export const LEGAL_VERSION = '1.0.0';
export const LEGAL_UPDATED = '18 August 2026';
export const SUPPORT_EMAIL = 'partners@ridebook.example';

export interface LegalSection {
  title: string;
  body: string;
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By creating a partner account or using the Ride-Book Partner app, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the service.',
  },
  {
    title: '2. Partner Service',
    body:
      'Ride-Book connects verified drivers with riders requesting on-demand and scheduled rides. As a partner, you receive ride requests, navigate to pickup, verify rider OTP for safety, complete trips, and earn fares net of a transparent commission.',
  },
  {
    title: '3. Your Data — Used Only to Serve You',
    body:
      'We collect the information needed to serve you: your name, phone, driving licence, vehicle and document details for verification, plus your live location. Your location is used solely to receive nearby ride requests and to let riders track your approach. ' +
      'We never sell your data, never use it for advertising, and you can request deletion at any time.',
  },
  {
    title: '4. Verification & Documents',
    body:
      'You must provide accurate identity, licence, vehicle registration, and insurance documents. We verify these for rider safety. Riding with invalid documents or misrepresented identity is grounds for removal.',
  },
  {
    title: '5. Fares & Commission',
    body:
      'Ride fares are set by the platform using transparent distance/duration pricing. A fixed commission rate is applied per trip; your earnings for each ride are shown clearly before you accept.',
  },
  {
    title: '6. Professional Conduct',
    body:
      'Be on time for pickups, treat riders with respect, follow traffic laws, and keep your vehicle clean and safe. Repeated cancellations or poor behaviour may affect your access to the platform.',
  },
  {
    title: '7. Liability & Insurance',
    body:
      'The platform facilitates trips between riders and partners. You remain responsible for safe driving and compliance with local transport regulations. To the fullest extent permitted by law, the platform is not liable for indirect losses.',
  },
  {
    title: '8. Changes & Contact',
    body:
      'We may update these Terms and will notify you of material changes. Questions? Contact us at ' + SUPPORT_EMAIL + '.',
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Information We Collect',
    body:
      'Account details (name, phone), verification documents (licence, registration, insurance, photo), vehicle information, live location while you are online, ride history, and support communications.',
  },
  {
    title: 'How We Use Your Information',
    body:
      'We use it exclusively to: verify your identity for rider safety, match you with ride requests near you, let riders track your arrival, calculate fares and earnings, and provide support. We do NOT use your data for advertising, profiling, or resale.',
  },
  {
    title: 'Location & Permissions',
    body:
      'While you are online, Ride-Book collects your GPS location continuously — including in the background — so you receive nearby ride requests and so riders can track your approach. This is the core of the service you are providing. You can go offline or stop sharing location any time.',
  },
  {
    title: 'Sharing',
    body:
      'We share your name, photo, vehicle details, and live ride position with the rider who books with you, and with service providers who help us operate (payments, maps, analytics). No third-party marketing sharing.',
  },
  {
    title: 'Security',
    body:
      'Your data is transmitted over encrypted connections and stored securely. Access is limited to staff who need it to operate the service.',
  },
  {
    title: 'Retention & Deletion',
    body:
      'We retain verification documents and ride records while your account is active and as required by law. You may request a copy or deletion of your data any time at ' + SUPPORT_EMAIL + '.',
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
    'Ride-Book Partner collects your location while online only so you can receive ride requests and so riders can track your arrival. Verification documents are used solely for rider safety. We never sell your data or use it for advertising.',
};