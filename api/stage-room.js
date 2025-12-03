export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ error: "Upload failed" });
    }

    try {
      const prompt = fields.prompt;
      const img = files.image?.[0];

      if (!img) {
        console.error("No image uploaded:", files);
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Read image file into base64
      const base64Image = fs.readFileSync(img.filepath, "base64");

      // FAL.ai request
      const response = await fetch("https://fal.run/flux-pro/inpaint", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          image_url: `data:image/jpeg;base64,${base64Image}`,
          // No mask needed — FAL auto-detects areas to modify
        })
      });

      const result = await response.json();

      if (!result || !result.images || !result.images[0]?.url) {
        console.error("FAL response:", result);
        return res.status(500).json({ error: "AI staging failed" });
      }

      const imageUrl = result.images[0].url;

      return res.status(200).json({ imageUrl });

    } catch (e) {
      console.error("FAL staging error:", e);
      return res.status(500).json({ error: "AI staging failed" });
    }
  });
}
