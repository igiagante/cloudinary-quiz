// app/admin/database/page.tsx
"use client";

import React, { useState } from "react";
import { questionRepository } from "@/lib/db/repositories/question.repository";
import Link from "next/link";

export default function DatabaseManagement() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first");
      return;
    }

    setIsLoading(true);
    setStatus("Processing...");

    try {
      // Get current question count
      const existingQuestions = await questionRepository.getAll();
      const existingCount = existingQuestions.length;

      // Read and parse the JSON file
      const jsonData = JSON.parse(await file.text());

      // Save questions to the database
      await questionRepository.bulkInsert(jsonData);

      // Get new count
      const updatedQuestions = await questionRepository.getAll();
      const newCount = updatedQuestions.length;

      setStatus(
        `Successfully imported ${
          newCount - existingCount
        } new questions. Total questions: ${newCount}`
      );
    } catch (error) {
      console.error("Error uploading questions:", error);
      setStatus("Error uploading questions. Please check the file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const questions = await questionRepository.getAll();
      const jsonStr = JSON.stringify(questions, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "cloudinary-questions.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading questions:", error);
      setStatus("Error downloading questions");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Database Management</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          Back to Admin
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Import Questions</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {isLoading ? "Uploading..." : "Upload Questions"}
            </button>
            {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Export Questions</h2>
          <button
            onClick={handleDownload}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md"
          >
            Download Questions
          </button>
        </div>
      </div>
    </div>
  );
}
