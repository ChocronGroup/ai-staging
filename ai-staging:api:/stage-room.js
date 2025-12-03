import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));

    req.on("end", async () => {
      const boundary = req.headers["content-type"].split("boundary=")[1];
      const body = Buffer.concat(chunks);

      // Parse multipart/form-data manually
      const parts = body.toString().split(`--${boundary}`);
      let prompt = "";
      let imageBuffer = null;

      for (const part of parts) {
        if (part.includes('name="prompt"')) {
          prompt = part.split("\r\n\r\n")[1]?.trim();
        }

        if (part.includes('name="image"')) {
          const imgStart = part.indexOf("\r\n\r\n") + 4;
          const imgEnd = part.lastIndexOf("\r\n");
          imageBuffer = Buffer.from(part.substring(imgStart, imgEnd), "binary");
        }
      }

      if (!prompt || !imageBuffer) {
        return res.status(400).json({ error: "Missing prompt or image" });
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await client.images.edit({
        model: "gpt-image-1",
        image: imageBuffer,
        prompt: `Virtual staging: ${prompt}`,
        size: "1024x1024",
        response_format: "b64_json"
      });

      const b64 = response.data[0].b64_json;

      res.status(200).json({
        imageUrl: `data:image/png;base64,${b64}`
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Staging failed" });
  }
}
