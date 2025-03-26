import { NextRequest, NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function GET(request: NextRequest) {
  try {
    const topics = await questionRepository.getAllTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
