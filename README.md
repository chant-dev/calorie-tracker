# Calories

A minimal, fast calorie and protein tracker. Smarter than Notes, simpler than a spreadsheet.

## Features

- **Daily logging** — view and manage entries by day, totals update instantly
- **USDA food search** — search millions of foods, enter an amount, calories and protein auto-calculate
- **Saved foods** — save any food for one-tap reuse on future days
- **Manual entry** — quickly log calories and protein with an optional food name
- **Edit & delete** — with Ctrl+Z undo on deletions

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Prisma](https://www.prisma.io) + SQLite
- [Tailwind CSS](https://tailwindcss.com)
- [USDA FoodData Central API](https://fdc.nal.usda.gov)

## Getting started

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file:

```
DATABASE_URL="file:./prisma/dev.db"
USDA_API_KEY="DEMO_KEY"
```

Get a free USDA API key (no rate limits) at [fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html).
