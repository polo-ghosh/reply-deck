import Header from '@/components/Header';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container narrow">
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 38 }}>Terms of Service</h1>
        <p>Last updated: {new Date().getFullYear()}</p>

        <div className="panel">
          <h2>Using the service</h2>
          <p>
            You may connect only Instagram Business or Creator accounts that you own or are authorised to manage.
            You are responsible for the content of your carousels and for complying with Instagram&apos;s Platform
            Policy, Messaging Terms, and applicable law, including any required disclosures that messages are automated.
          </p>
        </div>

        <div className="panel">
          <h2>Messaging limits</h2>
          <p>
            Instagram limits automated replies to a messaging window that is normally 24 hours from the person&apos;s
            last message, and allows only one private reply per comment. The service sends a carousel only when a
            configured trigger matches; it cannot override Meta&apos;s delivery rules or rate limits.
          </p>
        </div>

        <div className="panel">
          <h2>Availability</h2>
          <p>
            During Phase 1 this service is available only to accounts added as testers in the connected Meta app.
            It is provided as-is, without a guarantee of uptime. Features and access may change as Meta&apos;s
            platform requirements change.
          </p>
        </div>

        <div className="panel">
          <h2>Accounts and termination</h2>
          <p>
            You can disconnect at any time. We may suspend an account if it is used for spam, unsolicited bulk
            messaging, or anything that violates Meta&apos;s policies.
          </p>
        </div>
      </main>
    </>
  );
}
