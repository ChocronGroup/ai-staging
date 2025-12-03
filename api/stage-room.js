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

      // Convert uploaded image to base64
      const base64Image = fs.readFileSync(img.filepath, "base64");

      // Run FLUX.1 Inpaint (BEST staging model)
      const output = await replicate.run(
        "black-forest-labs/flux.1-inpaint",
        {
          input: {
            prompt: prompt,
            image: `data:image/jpeg;base64,${base64Image}`,
            mask: null, 
            guidance: 5,
            steps: 50
          }
        }
      );

      // Model returns a DIRECT URL to the staged image
      const imageUrl = output?.[0];

      res.status(200).json({ imageUrl });

    } catch (error) {
      console.error("Replicate staging error:", error);
      res.status(500).json({ error: "Staging failed" });
    }
  });
}
