import { NextRequest, NextResponse } from "next/server";

// Compatibility entry point: no external API, signer, or backend session.
export async function POST(request: NextRequest) {
  try {
    const { persona } = await request.json();
    if (!["student", "admin"].includes(persona))
      return NextResponse.json({ message: "Invalid persona" }, { status: 422 });
    return NextResponse.json({
      redirect: persona === "admin" ? "/admin" : "/user",
    });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 422 });
  }
}
