# Smart Bookmark App

A simple bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can log in via Google, add bookmarks, and see updates in real-time.

## Features
- Google OAuth login only
- Add bookmarks (title + URL)
- Private bookmarks for each user
- Real-time updates across tabs
- Delete bookmarks

## Tech Stack
- Next.js (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS

## Deployment
Deployed on Vercel: [Live URL](https://smart-bookmark-39ngvoefe-sanmatis-projects-8e2cb9c9.vercel.app)

## Problems & Solutions
- **Problem:** `supabaseUrl is required` error on deployment  
  **Solution:** Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.

- **Problem:** `useEffect async cleanup` TypeScript error  
  **Solution:** Updated `useEffect` to avoid returning an async function.

## How to Run Locally
```bash
npm install
npm run dev

