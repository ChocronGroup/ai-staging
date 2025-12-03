// REQUIRED: let Vercel know not to parse the body
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
  // ONLY allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Initialize formidable for handling file uploads
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ error: "Upload error" });
    }

    try {
      // Get prompt text from the form
      const prompt = fields.prompt;

      // IMPORTANT: your <input type="file"> is named "roomImage"
      const img = files.roomImage;

      // If no file was uploaded
      if (!img) {
        console.error("Uploaded files:", files);
        return res.status(400).json({ error: "Image missing from upload" });
      }

      // Use OpenAI IMAGE EDIT endpoint (this accepts an uploaded image)
      const result = await client.images.edits({
        model: "gpt-image-1",
        prompt: prompt,
        image: fs.createReadStream(img.filepath),
        size: "1024x1024",
        response_format: "b64_json"
      });

      // Convert base64 to data URL so browser can show it directly
      const base64 = result.data[0].b64_json;
      const imageUrl = `data:image/png;base64,${base64}`;

      // Respond with the finished staged image
      res.status(200).json({ imageUrl });

    } catch (error) {
      console.error("AI processing error:", error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });
}
