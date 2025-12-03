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

      let prompt = "";
      let imageBuffer = null;

      const parts = body.toString().split(`--${boundary}`);

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

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const job = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `Virtual staging: ${prompt}`,
        size: "1024x1024",
        image: imageBuffer,
        response_format: "b64_json",
        async: true
      });

      return res.status(200).json({ jobId: job.id });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create staging job" });
  }
}
