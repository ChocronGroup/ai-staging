import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Upload error" });

    try {
      const prompt = fields.prompt;
      const img = files.image;

      if (!img) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // OpenAI IMAGE EDITS (THIS ACCEPTS IMAGE UPLOAD)
      const result = await client.images.edits({
        model: "gpt-image-1",
        prompt,
        image: fs.createReadStream(img.filepath),
        size: "1024x1024",
        response_format: "b64_json"
      });

      const base64 = result.data[0].b64_json;
      const imageUrl = `data:image/png;base64,${base64}`;

      res.status(200).json({ imageUrl });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI processing failed" });
    }
  });
}
