export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

// OPENAI CLIENT
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable parse error:", err);
      return res.status(400).json({ error: "Upload error" });
    }

    try {
      const prompt = fields.prompt;

      // FILE FIX HERE (the correct field name is `image`)
      const img = files.image?.[0];

      if (!img) {
        console.error("Uploaded files:", files);
        return res.status(400).json({ error: "Image missing from upload" });
      }

      // OpenAI Image Edit (supports uploaded images)
      const result = await client.images.edits({
        model: "gpt-image-1",
        prompt: prompt,
        image: fs.createReadStream(img.filepath),
        size: "1024x1024",
        response_format: "b64_json"
      });

      const base64 = result.data[0].b64_json;
      const imageUrl = `data:image/png;base64,${base64}`;

      res.status(200).json({ imageUrl });

    } catch (error) {
      console.error("AI processing failed:", error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });
}
