export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

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
      const imageFile = files.image;

      const job = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        image: fs.createReadStream(imageFile.filepath)
      });

      res.status(200).json({ jobId: job.id });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI generation failed" });
    }
  });
}
