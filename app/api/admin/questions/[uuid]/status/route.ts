import { NextRequest, NextResponse } from "next/server";
import { questionRepository } from "@/lib/db/repositories/question.repository";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    if (!uuid) {
      return NextResponse.json(
        { error: "Question UUID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "review", "deleted"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (active, review, or deleted)" },
        { status: 400 }
      );
    }

    // Update the question status
    let success = false;
    if (status === "deleted") {
      success = await questionRepository.softDelete(uuid);
    } else {
      success = await questionRepository.updateStatus(uuid, status);
    }

    if (!success) {
      return NextResponse.json(
        { error: "Question not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating question status:", error);
    return NextResponse.json(
      { error: "Failed to update question status" },
      { status: 500 }
    );
  }
}
