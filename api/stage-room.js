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

      // Read image data into base64
      const imageBase64 = fs.readFileSync(img.filepath, {
        encoding: "base64",
      });

      // Use Stable Diffusion Inpainting model
      const output = await replicate.run(
        "stability-ai/stable-diffusion-inpainting:4fba758f87c1d4e61a34ea7cde5335c650b29fbb620142f4e2d8736301478bcb",
        {
          input: {
            prompt: prompt,
            image: `data:image/jpeg;base64,${imageBase64}`,
            mask: null, // Let model decide what to replace
            guidance_scale: 7.5,
            num_inference_steps: 50,
          },
        }
      );

      // Output is usually an array with first image URL
      const imageUrl = Array.isArray(output) ? output[0] : output;

      res.status(200).json({ imageUrl });

    } catch (error) {
      console.error("Replicate Error:", error);
      res.status(500).json({ error: "Staging failed" });
    }
  });
}
