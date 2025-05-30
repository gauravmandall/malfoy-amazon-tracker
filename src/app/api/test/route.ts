import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "API is working" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      message: "Received data successfully",
      receivedData: body,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error processing request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}
