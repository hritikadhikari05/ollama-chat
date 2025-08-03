import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(
      "https://ollama.hritikadhikari.com.np/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: `HTTP error! status: ${response.status}, message: ${errorText}`,
        },
        { status: response.status }
      )
    }

    // For streaming responses
    if (body.stream) {
      const reader = response.body?.getReader()
      if (!reader) {
        return NextResponse.json(
          { error: "Response body is null" },
          { status: 500 }
        )
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) break

              controller.enqueue(value)
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // For non-streaming responses
      const data = await response.text()
      return new Response(data, {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
