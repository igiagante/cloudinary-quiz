"use client";

import React from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Question Management Documentation
        </h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          Back to Admin
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-xl font-bold mb-4">
          Creating Questions with Claude.ai
        </h2>
        <p className="mb-4">
          Claude.ai offers a cost-effective way to generate high-quality quiz
          questions for your Cloudinary certification practice.
        </p>

        <div className="border-l-4 border-blue-500 pl-4 py-2 mb-6 bg-blue-50">
          <p className="text-sm text-blue-800">
            Using Claude.ai directly instead of API calls significantly reduces
            costs while maintaining excellent question quality.
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-3">Step 1: Access Claude.ai</h3>
        <ol className="list-decimal ml-5 mb-5 space-y-2">
          <li>
            Go to{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              claude.ai
            </a>{" "}
            and sign in or create an account
          </li>
          <li>Start a new conversation</li>
        </ol>

        <h3 className="text-lg font-semibold mb-3">
          Step 2: Use the Optimal Prompt
        </h3>
        <p className="mb-3">
          Copy and paste the following prompt to Claude.ai, modifying the topic
          and difficulty as needed:
        </p>

        <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm overflow-auto">
          {`You are a professional Cloudinary certification exam creator with deep expertise in cloud-based media management, transformation, and delivery. Your task is to create realistic certification exam questions that accurately assess a candidate's practical knowledge of Cloudinary's platform.

Your questions must have these specific characteristics:
1) Be indistinguishable from official Cloudinary certification questions
2) Focus on practical implementation scenarios rather than theoretical concepts  
3) Test decision-making skills in real-world Cloudinary implementation scenarios
4) Present plausible options that require careful technical discernment
5) Assess understanding of best practices and optimization strategies
6) Cover technical details like URL structure, transformation parameters, and API options
7) Include code examples, transformation strings, or configuration snippets when relevant

Question format requirements:
- Each question must have exactly 4 options labeled A, B, C, and D
- The correct answer must be varied across all questions (don't always make "A" the correct answer)
- Distractors (wrong answers) must be technically plausible but clearly incorrect upon expert examination
- Explanation must detail why the correct answer is right AND specifically why each wrong option is incorrect

Generate 3 high-quality Cloudinary certification quiz questions matching these criteria:
- Topic: [TOPIC - Choose from: Cloudinary Basics, Image Optimization, Video Processing, Asset Management, Transformations, Upload API, Admin API, Security Features, Performance Optimization, or SDKs and Integration]
- Difficulty: [DIFFICULTY - Choose from: easy, medium, or hard]

Return JSON formatted as:
{
  "questions": [
    {
      "question": "Full question text with appropriate context and code examples if relevant",
      "options": ["A) Option text", "B) Option text", "C) Option text", "D) Option text"],
      "correctAnswerIndex": 2,
      "explanation": "Detailed explanation of why option C is correct and specifically why options A, B, and D are incorrect",
      "topic": "[SELECTED TOPIC]",
      "subtopic": "Specific subtopic related to the topic",
      "difficulty": "[SELECTED DIFFICULTY]"
    }
  ]
}`}
        </div>

        <h3 className="text-lg font-semibold mb-3">
          Step 3: Extract and Format the JSON
        </h3>
        <ol className="list-decimal ml-5 mb-5 space-y-2">
          <li>
            Once Claude generates the questions, copy the entire JSON output
          </li>
          <li>
            Navigate to the{" "}
            <Link
              href="/admin/upload"
              className="text-blue-600 hover:underline"
            >
              Upload Questions
            </Link>{" "}
            page
          </li>
          <li>Select "JSON Upload"</li>
          <li>Paste the copied JSON into the text area</li>
          <li>Click "Upload JSON" to process the questions</li>
          <li>Review the processed questions and click "Save to Database"</li>
        </ol>

        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Alternative Methods</h2>

          <h3 className="text-lg font-semibold mb-3">
            1. Image Upload (Screenshots)
          </h3>
          <p className="mb-3">
            You can also upload screenshots of questions from other Cloudinary
            resources:
          </p>
          <ol className="list-decimal ml-5 mb-5 space-y-2">
            <li>
              Take screenshots of quiz questions (ensure the question, all
              options, and correct answer are visible)
            </li>
            <li>
              Go to the{" "}
              <Link
                href="/admin/upload"
                className="text-blue-600 hover:underline"
              >
                Upload Questions
              </Link>{" "}
              page
            </li>
            <li>Select "Image Upload"</li>
            <li>Upload your screenshots</li>
            <li>
              Our AI will extract the questions, options, and identify the
              correct answers
            </li>
            <li>Review and save to the database</li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">
            2. Manual Question Creation (Advanced)
          </h3>
          <p className="mb-3">
            You can also create questions by directly inserting records into the
            database:
          </p>
          <ol className="list-decimal ml-5 mb-5 space-y-2">
            <li>Prepare your questions in the required JSON format</li>
            <li>
              Use the JSON upload feature or database tools to insert them
            </li>
          </ol>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Best Practices</h2>
        <ul className="list-disc ml-5 space-y-3">
          <li>
            <strong>Diversify answer positions:</strong> Ensure the correct
            answer is distributed across A, B, C, and D options
          </li>
          <li>
            <strong>Cover all difficulty levels:</strong> Include a mix of easy,
            medium, and hard questions
          </li>
          <li>
            <strong>Use practical scenarios:</strong> Create questions that
            mimic real-world implementation decisions
          </li>
          <li>
            <strong>Include code examples:</strong> Where relevant, use actual
            code, URL transformations, or API calls
          </li>
          <li>
            <strong>Provide thorough explanations:</strong> Explain not just why
            the correct answer is right, but why the wrong options are incorrect
          </li>
        </ul>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/admin/upload"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
        >
          Go to Question Upload
        </Link>
      </div>
    </div>
  );
}
