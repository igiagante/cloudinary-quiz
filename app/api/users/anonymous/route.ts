// app/api/users/anonymous/route.ts
import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/db/repositories/user.repository";

export async function POST(request: NextRequest) {
  try {
    // Create a new anonymous user
    const userId = await userRepository.create({
      isAnonymous: true,
    });

    return NextResponse.json({ userId });
  } catch (error) {
    console.error("Error creating anonymous user:", error);
    return NextResponse.json(
      { error: "Failed to create anonymous user" },
      { status: 500 }
    );
  }
}
