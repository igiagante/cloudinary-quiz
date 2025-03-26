import { NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function DELETE() {
  try {
    // Get all questions
    const questions = await questionRepository.getAll();

    // Delete them one by one
    const results = await Promise.all(
      questions.map((q) => questionRepository.delete(q.uuid))
    );

    const deletedCount = results.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error("Error clearing all questions:", error);
    return NextResponse.json(
      { error: "Failed to clear questions" },
      { status: 500 }
    );
  }
}
