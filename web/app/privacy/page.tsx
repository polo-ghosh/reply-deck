import Header from '@/components/Header';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container narrow">
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 38 }}>Privacy Policy</h1>
        <p>Last updated: {new Date().getFullYear()}</p>

        <div className="panel">
          <h2>What we collect</h2>
          <p>
            When you connect your Instagram Business or Creator account, we store your Instagram account ID,
            username, granted permission scopes, and an encrypted Instagram User Access Token. We also store the
            carousels you build, the images you upload for them, and a short event log used to diagnose delivery
            problems and prevent duplicate replies.
          </p>
          <p>
            We do not read or store your followers&apos; personal information beyond the Instagram-scoped IDs
            needed to deliver a message you asked us to send.
          </p>
        </div>

        <div className="panel">
          <h2>How we use it</h2>
          <p>
            Only to run the automations you configure: receiving webhook events, matching them to your saved
            triggers, and sending the matching carousel through the Instagram Messaging API. We never sell your
            data or use it for advertising.
          </p>
        </div>

        <div className="panel">
          <h2>Retention and deletion</h2>
          <p>
            Access tokens are refreshed automatically and removed when you disconnect. To request deletion of all
            data associated with your account, use the Disconnect button in the app, remove the app in your
            Instagram settings, or email the operator listed in your app&apos;s contact details. Deletion removes
            your token, carousels, conversation state, and event log entries.
          </p>
          <p>
            If you disconnected from Instagram settings, our data deletion callback is notified and purges the same
            data automatically.
          </p>
        </div>

        <div className="panel">
          <h2>Third parties</h2>
          <p>
            Authentication, messaging, and webhooks are provided by Meta (Instagram Graph API). Application hosting
            and storage are provided by Cloudflare. Uploaded cover images are stored in Cloudflare KV and served
            from your app so that Instagram can display them.
          </p>
        </div>
      </main>
    </>
  );
}
