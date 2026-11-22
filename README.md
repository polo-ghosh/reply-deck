# Reply Deck

Send a swipeable Instagram carousel when someone messages you a keyword or comments on your Reel.

You use your own Meta app and your own Instagram account. No one else sees your data.

## What you need

- Instagram Business or Creator account. Free.
- Meta account. Free. Meta owns Instagram.
- Cloudflare account. Free. Cloudflare runs your app.
- GitHub account. Free. GitHub stores your copy of the code.

You do not download code. You do not use a terminal. You do not pay a monthly fee.

## How it works

1. Make a Meta app. Meta gives you an App ID and an App Secret.
2. Make a secret phrase. The guide gives the exact rule.
3. Open the Deploy link below. Cloudflare asks for the two numbers and the phrase.
4. Cloudflare makes your own copy of the app and puts it online.
5. Cloudflare gives you a web address. Open it. The Setup page appears.
6. Follow the Setup pages. Connect Instagram. Done.

## Start here

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mayankav/reply-deck)

Follow the guide from the top. It shows where to get the two numbers:

[Setup guide](https://github.com/mayankav/reply-deck/blob/main/SETUP.md)

When the guide says to deploy, open this link:

```
https://deploy.workers.cloudflare.com/?url=https://github.com/mayankav/reply-deck
```

The guide takes about 20 minutes.

## After setup

Open your web address. Select New carousel. Type a name and a trigger word. Add a title, a cover image, and a button. Save.

When someone sends that word, the carousel appears in the chat. The app renews your Instagram login each day. You do not connect again.

## For developers

These commands are not needed to use the app.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev
```

Open http://localhost:8787

The values in `.dev.vars` are examples. The Setup page shows them as missing. That is correct for a local test.

| Command | Use |
| --- | --- |
| `npm run dev` | Build the screens and start the app |
| `npm run build` | Build the screens only |
| `npm run typecheck` | Check the code |
| `npm run db:local` | Make the local storage |
| `npm run deploy` | Deploy your copy |

License: MIT.
