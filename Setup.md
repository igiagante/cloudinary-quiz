# Cloudinary Certification Quiz App - Setup Guide

This guide will help you set up and run the Cloudinary Certification Quiz application on your local machine or deploy it to production.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- OpenAI API key (for AI-generated questions)

## Project Setup

1. **Clone the repository or create a new Next.js project**

```bash
# Option 1: Start from scratch
npx create-next-app cloudinary-quiz
cd cloudinary-quiz

# Option 2: Clone the repository (if available)
git clone <repository-url>
cd cloudinary-quiz
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Environment Setup**

Create a `.env.local` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Project Structure

Follow the project structure as outlined in the code artifacts. Here's a quick overview:

```
cloudinary-quiz/
├── app/                    # Next.js app router
│   ├── api/                # API routes
│   ├── quiz/               # Quiz page
│   ├── results/            # Results page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
├── .env.local              # Environment variables
└── package.json            # Dependencies
```

## Tailwind CSS Setup

1. **Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

2. **Update `tailwind.config.js`**

```javascript
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

3. **Add Tailwind to your CSS**

In your `app/globals.css` file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Running the Application

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Key Features Implementation

### AI Question Generation

The application uses OpenAI's API to generate quiz questions. The main implementation is in `lib/quiz-generator.ts`.

- Make sure your OpenAI API key is properly set in `.env.local`
- Adjust the model in the code if needed (currently using "gpt-3.5-turbo-0125")
- Consider implementing caching strategies for better performance

### Quiz State Management

The quiz state is managed using React's useState and stored in localStorage for persistence between pages.

- Quiz settings are configured on the home page
- Questions are fetched and displayed on the quiz page
- Results are calculated and shown on the results page

### Results Analysis

The app analyzes user performance by:

- Calculating overall score percentage
- Breaking down performance by topic
- Identifying areas for improvement
- Providing recommendations based on results

## Deployment

You can deploy this application to Vercel with a few simple steps:

1. **Create a Vercel account** if you don't have one already
2. **Install Vercel CLI** or use the Vercel GitHub integration
3. **Set up environment variables** in the Vercel dashboard
4. **Deploy the application**

```bash
# Using Vercel CLI
vercel
```

## Customization Options

### Adding More Topics

To add more Cloudinary certification topics, update the `lib/cloudinary-topics.ts` file with additional topics and subtopics.

### Changing Quiz Difficulty

You can adjust the difficulty distribution in `lib/quiz-generator.ts` to make the quiz easier or harder.

### Modifying UI Elements

The components in the `components/` directory can be customized to match your desired look and feel.

## Troubleshooting

### API Rate Limits

If you encounter issues with OpenAI API rate limits:

- Implement proper caching
- Consider using a pre-generated question bank for common topics
- Add retry logic with exponential backoff

### Browser Storage Limitations

If users experience issues with localStorage:

- Consider limiting the number of questions stored
- Implement a server-side storage solution for larger datasets

## Next Steps for Development

1. **Add user authentication** to save quiz history
2. **Implement spaced repetition** for better learning retention
3. **Add more detailed analytics** to track progress over time
4. **Create shareable quiz results** for social media
5. **Develop a mobile app version** using React Native

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
