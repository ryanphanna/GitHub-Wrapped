# Roadmap

This document outlines the future vision and feature roadmap for the GitHub Wrapped application.

## Features

- **Personalized Theme Builder**: Allow users to create custom color palettes and select background patterns for their cards.
- **Shareable Landing Pages**: Generate unique URLs for cards so users can share interactive web views instead of only PNG files.
- **Advanced Stat Insights**: Detailed breakdown of "Code Impact" (lines added/deleted) and "Collaboration" (PR reviews and comments).
- **Multi-Account Comparison**: A "Versus" mode to compare your monthly stats side-by-side with another developer.
- **Export to Video**: Generate short, animated transitions of the monthly stats for sharing as Reels or TikToks.

## Paid Accounts ($3/month)

A premium tier built around persistence and history. Free tier stays exactly as-is (type username, generate, download).

- **GitHub OAuth Login**: Sign in with GitHub — doubles as authentication and automatically provides a user token, eliminating rate limit issues for paid users.
- **Card History**: Every generated card is saved to the user's account. Browse and re-download any past monthly or yearly card.
- **Trends Dashboard**: Month-over-month commit trends, best month ever, consistency scores, and year-over-year comparisons — all built from saved history over time.
- **Auto Yearly Recap**: Yearly card automatically generated each January for the prior year.
- **All Premium Features Included**: Clean (watermark-free) exports, premium themes, shareable landing pages, and higher resolution downloads bundled into the subscription.

**Implementation stack**: NextAuth.js (GitHub OAuth provider) + Vercel Postgres + Stripe ($3/month subscription).

## Monetization

- **Ad Before Generation**: Display a short interstitial ad while the card is generating (generation takes a few seconds anyway, making it a natural placement).
- **Premium Themes**: Free users get Daylight and Midnight; paid users unlock Gold, Cyberpunk, and any future themes.
- **Clean Export**: Free cards include a subtle watermark; paid users get unbranded PNG exports.
- **Shareable Landing Pages (Paid)**: Free users get PNG download only; paid users get a hosted link (e.g. `githubwrapped.app/u/username/2025`) that creates a growth loop — every shared link is an ad.
- **Higher Resolution Export**: Free tier exports at 1080×1920; paid tier exports at 2x (2160×3840) for wallpaper or print quality.
- **Buy Me a Coffee / GitHub Sponsors**: Low-effort tip jar for users who want to support the project.

---

[Back to Home](./README.md)
