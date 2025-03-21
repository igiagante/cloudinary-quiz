# Cloudinary Certification Quiz App

An interactive quiz application to help you prepare for the Cloudinary Program Certification exam. This app uses AI to generate realistic exam questions, tracks your performance by topic, and provides personalized study recommendations.

![Cloudinary Quiz App](https://res.cloudinary.com/demo/image/upload/w_700,c_fill,g_center,f_auto,q_auto/cloudinary_quiz_app_demo.png)

## 🎯 Features

- **AI-Generated Questions**: Dynamically creates realistic certification questions using AI
- **Topic-Specific Practice**: Focus on specific Cloudinary topics or test your knowledge across all areas
- **Customizable Difficulty**: Choose easy, medium, hard, or mixed difficulty levels
- **Instant Feedback**: Get explanations for correct and incorrect answers
- **Performance Analytics**: Track your strengths and weaknesses by topic
- **Passing Score Tracking**: See if you've achieved the 80% passing score requirement
- **Study Recommendations**: Get personalized advice on which topics to study more

## ✨ Why This App?

The Cloudinary Certification exam requires an 80% passing score, testing your knowledge across multiple topics. This app helps you:

1. **Practice with realistic questions** similar to those on the actual exam
2. **Identify knowledge gaps** before taking the certification
3. **Focus your study time** on the topics where you need the most improvement
4. **Build confidence** by tracking your progress over time

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- OpenAI API key (for AI-generated questions)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/cloudinary-quiz-app.git
   cd cloudinary-quiz-app
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create an `.env.local` file with your OpenAI API key

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Topics Covered

The quiz covers all key areas of the Cloudinary certification exam:

- **Cloudinary Basics**: Architecture, core services, pricing models
- **Image Optimization**: Format selection, quality optimization, responsive images
- **Video Processing**: Transcoding, adaptive streaming, transformations
- **Asset Management**: Media library, folders, tags, metadata
- **Transformations**: URL-based transformations, chaining, named transformations
- **Upload API**: Methods, presets, direct uploads
- **Admin API**: Resource management, reports, user management
- **Security Features**: Signed URLs, access control, restrictions
- **Performance Optimization**: CDN usage, caching strategies, global distribution
- **SDKs and Integration**: JavaScript, React, Node.js, framework integration

## 💡 How It Works

1. **Configure Your Quiz**: Select number of questions, difficulty level, and topics
2. **Take the Quiz**: Answer each question and get immediate feedback
3. **Review Results**: See your score and detailed breakdown by topic
4. **Get Recommendations**: Receive suggestions for improving your weak areas
5. **Practice Again**: Focus on specific topics or take a comprehensive quiz

## 🧠 AI-Powered Questions

This app uses the OpenAI API to generate high-quality quiz questions that:

- Mirror the format and difficulty of actual certification questions
- Test practical knowledge and real-world scenarios
- Cover both fundamental concepts and advanced features
- Include proper code examples and best practices
- Offer educational explanations for answers

## 🛠️ Technologies Used

- **Next.js**: React framework for the frontend and API routes
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vercel AI SDK**: For integrating with AI models
- **OpenAI API**: Powers the question generation
- **TypeScript**: For type safety and better developer experience
- **localStorage**: For persisting quiz state between sessions

## 📊 Performance Tracking

Track your performance to identify areas for improvement:

- **Overall Score**: See if you've reached the 80% passing threshold
- **Topic Breakdown**: Visualize your performance across all Cloudinary topics
- **Weak Areas**: Quickly identify topics that need more study
- **Progress Over Time**: See how your scores improve with practice

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Cloudinary](https://cloudinary.com/) for their excellent documentation
- [OpenAI](https://openai.com/) for their powerful language models
- [Vercel](https://vercel.com/) for the AI SDK and hosting platform
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

_This application is unofficial and not affiliated with Cloudinary. It is designed as a study aid for certification preparation._
