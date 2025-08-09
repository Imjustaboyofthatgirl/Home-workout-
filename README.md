# Ruhi‑Ready — 12 Months, 30 Active Days (HTML/CSS/JS + Firebase)

A mobile‑first tracker you can host on **GitHub Pages**. Auth, Firestore, and Storage via Firebase.

## 1) Firebase Setup (on your phone) 📱
1. Go to https://console.firebase.google.com → **Create project** → enable **Google Analytics** = off (optional).
2. In **Build → Authentication → Sign‑in method** → enable **Email/Password**.
3. In **Build → Firestore Database** → Create database (Production mode).
4. In **Build → Storage** → Get started.
5. In **Project settings → Your apps** → **Web app** → Register app → Copy the config.
6. Open `/js/firebase.js` and paste your config into `firebase.initializeApp(...)`.

## 2) Security Rules 🔒
- Open **Firestore Rules** → paste **`firebase.rules`** → **Publish**.
- Open **Storage Rules** → paste **`storage.rules`** → **Publish**.

## 3) Host on GitHub Pages 🌐
1. Create a **new GitHub repo** named anything (e.g., `ruhi-ready`).
2. Upload all files/folders from this project.
3. Repo **Settings → Pages** → Branch: **main**; Folder: **/** (root) → **Save**.
4. Open the Pages URL it gives you (e.g., `https://yourname.github.io/ruhi-ready`).

## 4) Use the App
- Open **index.html** on your Pages URL.
- **Sign up or Log in** (Email/Password).
- If first time: set the **12 month titles** (immutable).
- Tap a month → **unlock editing** with your **Edit Key** (set it in **profile.html**). Unlock lasts **30 minutes**.
- Tap a day → mark **Completed** and add a **note** (autosave on **Save**).
- Upload a **Start Photo** anytime; on **Day 30**, you’ll be prompted for an **End Photo** and a **compare slider** shows up.
- Milestones at **10/20/30** throw confetti + a playful toast. Edit these in `js/config.js`.

## 5) Share a Month (read‑only) 🔗
- In a month page, tap **Create share link**.
- The app writes a **read‑only snapshot** to `/shares/{publicId}` and mirrors photos under `phase-photos-public/{publicId}/...`.
- The link looks like: `share.html?m=3&id=PUBLIC_ID` — anyone can view, **no edits**.

## 6) Stats
- Dashboard shows **Total active days** and **Last workout date** across months.

## 7) FAQ
**Can I change month titles?** No (by design). Reset by deleting docs in Firestore.

**How do I reset a month?** Delete `/days/{uid}/months/{m}/days/*` and set them again. Or rebuild the project data for that month.

**Replace photos?** Upload again; it overwrites the same filename. Re‑create share link to refresh the public mirror.

**Why a public mirror for shares?** It lets viewers load images without signing in, while Storage rules still prevent random writes.

**Composite indexes needed?** Not for this base app.
