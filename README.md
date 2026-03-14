# Learnova | AI-Powered Adaptive Classroom

Learnova is a next-generation intelligent educational platform that personalizes learning for students and provides deep, data-driven insights for educators.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **AI Engine**: [Genkit](https://github.com/firebase/genkit) + [Gemini 2.5 Flash](https://ai.google.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Analytics**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Key Features

- **Personalized AI Tutoring**: Dynamic study notes and quizzes generated specifically for individual learning paces.
- **Adaptive Assessments**: Real-time evaluation of student proficiency with AI-generated feedback.
- **Deep Analytics**: Comprehensive progress tracking for both students and teachers.
- **Live Classroom Interaction**: Real-time lecture management and student engagement tools.
- **AI Strategy Engine**: Actionable instructional recommendations for teachers based on classroom performance data.

## 🏁 Getting Started

1.  **Firebase Setup**: Ensure your Firebase config is correctly updated in `src/firebase/config.ts`.
2.  **Environment Variables**: Add your `GEMINI_API_KEY` to the `.env` file for AI features.
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
4.  **Run Genkit (AI Debugging)**:
    ```bash
    npm run genkit:dev
    ```

Developed with ❤️ using Firebase Studio.
