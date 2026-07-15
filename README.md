<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/461ef4f9-48cb-4b40-87c1-df7f8a27475d

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill in the values:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — required. SpiritsVerse
     talks to a shared "Verse" Supabase project (also used by Cookbook.io and StrainVerse). Ask a
     project maintainer for the publishable key, or point these at your own Supabase project and
     run [`sql/complete-setup.sql`](sql/complete-setup.sql) (drops legacy `spirits` schema + fresh `SpiritsVerse` install) or [`sql/update.sql`](sql/update.sql) (idempotent) or [`sql.txt`](sql.txt) (full reset) in the
     Supabase SQL editor to create the `SpiritsVerse` schema.
   - Then run [`sql/seed-drinks.sql`](sql/seed-drinks.sql) to load **1300+ drinks** into the directory.
3. Run the app:
   `npm run dev`

The app will throw a clear startup error if the Supabase environment variables are missing, since
authentication and all data (posts, drinks, groups, etc.) depend on them.

## Full Specification

See [SPEC.md](SPEC.md) for the complete application specification — architecture, features,
database schema, API reference, data flows, and deployment guide.
