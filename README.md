# Smart Pantry System

AI-powered smart pantry management system built to help households reduce food waste through shared inventory tracking and intelligent recommendations.

# Smart Pantry Web Application

This project is a web-based smart pantry system.
It allows multiple users in a household to manage shared food inventory, generate meals using available ingredients, and receive AI-powered assistance for food and plant care decisions.

The system focuses on promoting responsible consumption and improving everyday food management using modern cloud technologies.

# ✨ Features

- Shared household pantry management
- Real-time ingredient tracking
- AI meal generator based on available ingredients
- Built-in AI assistant
- Fertilizer and plant-care recommendations
- Multi-user collaboration system

# 🛠️ Technologies Used

- JavaScript (React / Next.js)
- Firebase Authentication
- Cloud Firestore (Firebase Database)
- Google Gemini API

# ⚙️ Technical Architecture

The application follows a client–cloud architecture:

- Frontend web application handles user interaction and UI.
- Firebase manages authentication and real-time database storage.
- Gemini AI processes prompts to generate meals, fertilizer tips, and assistant responses.

# 🚧 Challenges Faced

Firebase was a new technology during development, which created challenges in understanding NoSQL database structure and real-time synchronization.

Key challenges included:
- Designing Firestore data models
- Managing shared household data
- Debugging data synchronization issues

Through testing, documentation study, and iterative debugging, a stable real-time backend system was successfully implemented.

# 🔮 Future Roadmap

- Mobile application version
- AI personalization based on user habits
- Expiry reminders and smart notifications
- Grocery service integration
- Food usage analytics dashboard

# About This Project

This project demonstrates practical experience in:

- Full-stack web development
- Firebase backend integration
- Google AI (Gemini) implementation
- Real-time collaborative system design

---
  
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
