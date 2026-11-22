# Reply Deck setup

You need four free accounts: Instagram, Meta, Cloudflare, GitHub.
Time: about 20 minutes.

## Skip what you already have

| If you already have this | Skip |
| --- | --- |
| Instagram Business or Creator account | Step 1 |
| Meta app with Instagram login | Step 2 |
| Your own copy of the app | Step 4 |
| Tester invite accepted | Step 7 |

Do the other steps in order.

---

## Step 1 — Make Instagram a business account

Skip this if your Instagram profile shows Business or Creator.

1. On your phone, open Instagram.
2. Open Settings → Account.
3. Select Switch to professional account.
4. Select Business or Creator.
5. Make the account public.

**Check:** Your profile shows a category, for example Business or Creator.
**If not:** Open Settings → Account again and repeat step 3.

---

## Step 2 — Get two numbers from Meta

Do only one of the two paths. Both paths end at "Copy the numbers".

### Path A — You do not have a Meta app

1. Open https://developers.facebook.com/apps/
2. Select Create app.
3. Select Other → Business.
4. Type an app name and your email. Select Create app.
5. Find Instagram. Select Set up.
6. Select the Instagram login setup.
7. Go to "Copy the numbers" below.

### Path B — You already have a Meta app

1. Open https://developers.facebook.com/apps/
2. Select your app.
3. Find Instagram → API setup with Instagram login → Business login settings.
4. Go to "Copy the numbers" below.

### Copy the numbers

1. Find App ID. Select the number. Copy it. Paste it into a note on your phone or computer.
2. Find App Secret. Select it. Copy it. Paste it into the same note.
3. Keep the secret private.

**Check:** Your note has two values. One is short. One is long.
**If a label looks different:** Meta changes labels. Keep the same meaning. Help: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login

---

## Step 3 — Create your secret phrase

Meta uses this phrase to check that messages come from your app. Only you know it.

Rules:

- 20 or more letters and numbers
- no spaces
- not used anywhere else

Example: `blueRiver92mangoLamp47`

Do not use the example. Type your own. Write it down. You use it in Step 4 and Step 5.

---

## Step 4 — Make your own copy of the app

Skip this if Cloudflare already gave you a web address. Use that address as YOUR_LINK.

1. Open this link:

```
https://deploy.workers.cloudflare.com/?url=https://github.com/mayankav/reply-deck
```

2. Select Connect GitHub. Allow. If asked, make a free account.
3. Select Connect Cloudflare. Allow. If asked, make a free account.
4. Type a name. Example: `my-reply-deck`
5. Paste App ID, App Secret, and your secret phrase.
6. Select Deploy. Wait until it finishes.
7. Copy the web address Cloudflare shows you.

Call this address **YOUR_LINK**. Example: `https://my-reply-deck.example.workers.dev`

**Check:** YOUR_LINK opens in your browser.
**If it does not open:** Wait two minutes. Open it again.

---

## Step 5 — Tell Meta where to send messages

1. On your Meta page, find the Instagram login settings.
2. Paste this in the return address box:

```
YOUR_LINK/auth/callback
```

3. In the left menu, select Webhooks.
4. Paste this in the callback box:

```
YOUR_LINK/webhook
```

5. Paste your secret phrase in the verify box.
6. Select Verify and save.
7. Select three boxes: `messages`, `messaging_postbacks`, `comments`.
8. Select Save.

**Check:** The three boxes stay selected after you save.
**If verify fails:** Your secret phrase in Meta does not match the one in Cloudflare. Fix one to match the other.

---

## Step 6 — Add four links in Meta

In Meta, go to App Settings → Basic. Paste:

```
Privacy link              YOUR_LINK/privacy
Terms link                YOUR_LINK/terms
When user leaves          YOUR_LINK/auth/deauthorize
When user deletes data    YOUR_LINK/privacy/data-deletion
```

Select Save changes.

**Check:** The four links stay saved when you reopen the page.

---

## Step 7 — Add yourself as a tester

Skip this if you already accepted a tester invite.

1. In Meta, open App Roles → Roles → Add user.
2. Select Instagram Tester. Do not select Tester.
3. Type your Instagram username. Do not type @.
4. Send the invite.
5. On your phone, open https://www.instagram.com/accounts/manage_access/
6. Select Tester Invites. Accept.

**Check:** The invite disappears from Tester Invites.

---

## Step 8 — Connect your account

1. Open YOUR_LINK in a browser.
2. Select Setup. Green dots mean the settings are correct.
3. Select Connect Instagram.
4. Log in. Select Allow.

**Check:** The dashboard opens and shows your @username.
**If a dot is not green:** Select Run check again. Fix the item with the grey dot.

---

## Step 9 — Test it

1. Select New carousel.
2. Name: `Test`
3. Trigger: DM keyword → Exact → `MENU`
4. Card title: `Hello`
5. Subtitle: `Pick one`
6. Upload any JPG image.
7. Button: Open website → `View menu` → `https://example.com`
8. Select Create carousel.
9. From a second Instagram account, send `MENU` to your account. Use the phone app.

**Check:** The carousel appears in the chat.

---

## If something is wrong

| Problem | Fix |
| --- | --- |
| Verify fails | The phrase in Step 3 does not match Step 5 |
| "Account is not connected" | Accept the tester invite. Use a Business or Creator account |
| Login shows an error | The return address must equal `YOUR_LINK/auth/callback` |
| No carousel arrives | Use the phone app. Send within 24 hours of the last message |

If you get stuck, send a picture of your screen to the person who gave you this guide.
