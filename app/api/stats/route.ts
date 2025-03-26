import { NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function GET() {
  try {
    const stats = await questionRepository.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
