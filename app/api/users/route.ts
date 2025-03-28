// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/db/repositories/user.repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, avatarUrl } = body;

    // Create a new user
    const userId = await userRepository.create({
      email,
      name,
      avatarUrl,
      isAnonymous: !email,
    });

    return NextResponse.json({ userId });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get("id");

    if (!uuid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await userRepository.getById(uuid);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
