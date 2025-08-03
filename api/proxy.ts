export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  )
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const response = await fetch(
      "https://ollama.hritikadhikari.com.np/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify(req.body),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      res.status(response.status).json({
        error: `HTTP error! status: ${response.status}, message: ${errorText}`,
      })
      return
    }

    // For streaming responses
    if (req.body.stream) {
      res.setHeader("Content-Type", "text/plain")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")

      const reader = response.body?.getReader()
      if (!reader) {
        res.status(500).json({ error: "Response body is null" })
        return
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Write the chunk to the response
        res.write(value)
      }

      res.end()
    } else {
      // For non-streaming responses
      const data = await response.text()
      res.status(200).send(data)
    }
  } catch (error) {
    console.error("Proxy error:", error)
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    })
  }
}
