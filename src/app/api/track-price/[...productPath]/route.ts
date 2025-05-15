import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { productPath: string[] } }) {
  return NextResponse.json({
    message: "This endpoint requires a POST request with a product URL and ZIP code",
    method: "GET",
    params: params.productPath,
  })
}
