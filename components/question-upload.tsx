"use client";

import React, { useState } from "react";
import { Topic } from "@/types";

// Define local types instead of importing from database
interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface QuestionInput {
  question: string;
  options: QuestionOption[];
  explanation: string;
  topic: Topic;
  difficulty: "easy" | "medium" | "hard";
  source?: string;
}

// Topics and difficulties as constants
const Topics = [
  "Products, Value, Environment Settings, and Implementation Strategies",
  "System Architecture",
  "Media Lifecycle Strategy and Emerging Trends",
  "Widgets, Out of Box Add-ons, Custom Integrations",
  "Upload and Migrate Assets",
  "Transformations",
  "Media Management",
  "User, Role, and Group Management and Access Controls",
] as const;

const Difficulties = ["easy", "medium", "hard"] as const;

interface QuestionUploadProps {
  onQuestionsUploaded: (questions: QuestionInput[]) => void;
}

export default function QuestionUpload({
  onQuestionsUploaded,
}: QuestionUploadProps) {
  const [uploadType, setUploadType] = useState<"json" | "image">("json");
  const [jsonInput, setJsonInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJsonUpload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedJson = JSON.parse(jsonInput);
      const questions = Array.isArray(parsedJson)
        ? parsedJson
        : parsedJson.questions;

      if (!Array.isArray(questions)) {
        throw new Error(
          "Invalid JSON format. Expected an array or an object with a 'questions' array."
        );
      }

      // Validate questions format
      const validQuestions = questions.map((q: any) => {
        // Validate topic and difficulty
        const topic = Topics.includes(q.topic) ? q.topic : Topics[0];
        const difficulty = Difficulties.includes(q.difficulty)
          ? q.difficulty
          : "medium";

        // Handle different options formats
        let options: { text: string; isCorrect: boolean }[] = [];
        let correctAnswer = "";

        if (Array.isArray(q.options)) {
          if (q.options[0] && typeof q.options[0] === "object") {
            // Already in the right format: [{text, isCorrect}, ...]
            options = q.options.map((o: any) => ({
              text: o.text || "",
              isCorrect: Boolean(o.isCorrect),
            }));
            correctAnswer = options.find((o) => o.isCorrect)?.text || "";
          } else if (typeof q.options[0] === "string") {
            // Convert from ["Option A", "Option B", ...] format
            options = q.options.map((o: string, i: number) => ({
              text: o,
              isCorrect: i === (q.correctAnswerIndex || 0),
            }));
            correctAnswer = q.options[q.correctAnswerIndex || 0] || "";
          }
        }

        return {
          question: q.question || "",
          explanation: q.explanation || "",
          topic,
          difficulty,
          options,
          source: "manual",
        } as QuestionInput;
      });

      onQuestionsUploaded(validQuestions);
      setSuccess(`Successfully processed ${validQuestions.length} questions`);
    } catch (err) {
      console.error("Error parsing JSON:", err);
      setError(err instanceof Error ? err.message : "Failed to parse JSON");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/extract-questions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process images");
      }

      const data = await response.json();
      onQuestionsUploaded(data.questions);
      setSuccess(
        `Successfully extracted ${data.questions.length} questions from ${selectedImages.length} images`
      );
      setSelectedImages([]);
    } catch (err) {
      console.error("Error uploading images:", err);
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    setSelectedImages(imageFiles);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Quiz Questions</h2>

      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setUploadType("json")}
            className={`px-4 py-2 rounded-md ${
              uploadType === "json"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            JSON Upload
          </button>
          <button
            onClick={() => setUploadType("image")}
            className={`px-4 py-2 rounded-md ${
              uploadType === "image"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Image Upload
          </button>
        </div>

        {uploadType === "json" ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Paste JSON containing quiz questions. The format should be an
              array of question objects or an object with a 'questions' array.
            </p>
            <textarea
              className="w-full h-48 p-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder='[{"question": "What is Cloudinary?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswerIndex": 0, "explanation": "Explanation text", "topic": "Cloudinary Basics", "difficulty": "medium"}]'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            ></textarea>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              onClick={handleJsonUpload}
              disabled={loading || !jsonInput.trim()}
            >
              {loading ? "Processing..." : "Upload JSON"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Upload screenshots of quiz questions. The system will attempt to
              extract the question, options, and correct answer.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                Click to select images
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF
              </p>
              {selectedImages.length > 0 && (
                <div className="mt-3 text-left">
                  <p className="text-sm font-medium">
                    {selectedImages.length} images selected:
                  </p>
                  <ul className="mt-1 text-xs text-gray-600">
                    {selectedImages.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              onClick={handleImageUpload}
              disabled={loading || selectedImages.length === 0}
            >
              {loading ? "Processing Images..." : "Upload Images"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
