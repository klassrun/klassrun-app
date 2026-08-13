# Klassrun App — in plain English

*A non-technical companion to the developer README. This explains the part of Klassrun that people actually look at and click — the school portal — and how it keeps a login safe while talking to the engine behind it. No coding knowledge needed.*

*Current as of August 2026.*

---

## The one-paragraph version

The **app** is the school portal at **app.klassrun.com** — the set of screens a principal, teacher, bursar, or parent logs into and clicks around. It's the "front desk." It shows you pages, holds your login securely, and passes every request you make to the **engine** (the API) behind it. On its own it stores no school data; it's the polished, friendly face in front of the machinery.

---

## Where this piece sits

Klassrun is three pieces:

- **The marketing site** (klassrun.com) — the public shop window that convinces a school to sign up.
- **The app** *(this one)* — app.klassrun.com — where signed-up schools do their actual work.
- **The engine** (the API) — invisible, does the work and keeps the records.

**An analogy.** The app is the **branch building and the teller**. You walk in (open the site), show ID (log in), and ask for things. The teller doesn't keep the vault behind the counter — they relay your request to the vault (the engine) and hand you back the result. You never go into the vault yourself.

---

## What the app is responsible for

**1. Showing the right screens to the right person.** A principal sees the admin dashboard — teachers, classes, students, results, fees, settings. A teacher sees their own classes and the AI tools. A bursar sees fees only. A parent sees their child's record. The app decides which door you walk through based on who you are.

**2. Keeping your login safe.** When you log in, the app tucks your login token into a special cookie that the browser's own scripts are **not allowed to read**. This is a deliberate shield: even if a malicious script somehow ran on the page, it couldn't steal your session. (There's a second, harmless cookie holding just your role — admin/teacher/etc. — used only to route you to the right screen quickly. The real security checks always happen in the engine.)

**3. Relaying everything to the engine.** Here's the important bit for understanding the whole system: **your browser never talks to the engine directly.** Every request — load my classes, generate a note, mark a fee — goes to the app first. The app quietly attaches your secure login token and forwards it to the engine, then hands the answer back to your screen. This keeps the engine's address and your token out of reach of anything running in your browser.

---

## How a click becomes an answer

Say a teacher clicks **"Generate scheme of work":**

1. The screen sends the request to the **app** (not the engine).
2. The app reads your secure login cookie and re-sends the request to the **engine** with your token attached.
3. The engine checks who you are, whether you're allowed, and whether the school has paid — then does the work and replies.
4. The app receives the finished scheme and paints it on your screen.

If you're not logged in and try to open a protected page, the app stops you at the door and sends you to the login screen first. If you're already logged in and try to open the login page, it waves you straight through to your dashboard.

---

## What a school can do here today

- **Sign up** and pick their web address (their "slug", e.g. `greenfield` → the school's identity in the system).
- **Set up the school:** sessions and terms, classes, subjects, invite teachers, upload a logo and school details.
- **Generate with AI:** lesson notes, schemes of work, exam questions, report-card comments — all aligned to the Nigerian curriculum.
- **Run operations:** student records, results and grading, report cards, attendance, behaviour, promotion at year-end, and fees (bursar included).
- **Subscribe and pay** through Paystack, and see the price held for their school.

---

## Plans and prices (what the screens show)

The app always shows a school the **price the engine will actually charge** — the words on screen can't drift from the billing maths. Current plans, billed monthly:

- **Starter — ₦20,000/month** (up to 10 teachers): school operations + AI lesson notes, schemes, exam papers.
- **Standard — ₦35,000/month** (up to 30 teachers): adds AI report-card comments, question bank, scheme upload, branded exports.
- **Premium — ₦55,000/month** (unlimited teachers): adds fees & bursar, and — as they roll out — parent portal, notifications, and more.

Every payment buys exactly 30 days. Paying early stacks the days on top. A 14-day free trial needs no card.

---

## Getting it running (for whoever sets it up)

The app is a Next.js program (a modern website framework). Like the engine, someone technical sets it up once and then it runs itself on the server. Each boxed line is a command typed into a terminal.

**You need first:** Node.js (version 20 or newer), and the **engine (klassrun-api) already running** on the same machine at `http://localhost:4000`. The app is a front desk — its engine must be up, or the screens have nothing to talk to.

**1. Get the code's building blocks:**
```
npm install
```

**2. Point it at the engine.** Copy the example settings file; the defaults already point at the local engine on port 4000:
```
cp .env.example .env.local
```
The two settings inside are the engine's address (`KLASSRUN_API_URL`) and the app's own address (`NEXT_PUBLIC_APP_URL`).

**3. Start it:**
```
npm run dev
```
Then open `http://localhost:3000` in a browser — that's the portal you log into.

**On the real server** the app lives on **Vercel** and **redeploys itself automatically** whenever code is pushed to the `main` branch. Its settings there point at the live engine (`https://klassrun-api.onrender.com`) instead of the local one, and it runs as a full application (not a static page dump) because it needs to run its own secure "relay to the engine" steps out of the browser's reach.

---

## Where it lives and how it's kept safe

- **Hosting:** the app runs on **Vercel**. It's a full application (not a static page dump), because it needs to run those secure "relay to the engine" steps on its own server, out of the browser's reach.
- **Login shield:** the login token lives in a browser-unreadable cookie, sent over an encrypted connection in production.
- **The app never enforces security by itself** — it reflects what the engine decides. Hiding a button you can't use is a convenience; the engine is what actually refuses the action. This means a clever user can't unlock anything just by poking at the screens.

---

## Contact

- **Website:** klassrun.com · **Email:** info@klassrun.com
- **Company:** Klassrun Technologies Ltd · RC 9463863 · Lagos, Nigeria
