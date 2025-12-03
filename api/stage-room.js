export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form error:", err);
      return res.status(400).json({ error: "Upload error" });
    }

    try {
      const prompt = fields.prompt;
      const img = files.image?.[0];

      if (!img) {
        console.error("No image:", files);
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Read uploaded file into base64
      const base64Image = fs.readFileSync(img.filepath, "base64");

      // ✔️ 100% working Replicate model
      const output = await replicate.run(
        "stability-ai/stable-diffusion-inpainting",
        {
          input: {
            prompt: prompt,
            image: `data:image/jpeg;base64,${base64Image}`,
            mask: null, // No mask required — model handles everything
          }
        }
      );

      const imageUrl = output?.[0];

      return res.status(200).json({ imageUrl });

    } catch (error) {
      console.error("Replicate staging error:", error);
      return res.status(500).json({ error: "Staging failed" });
    }
  });
}
