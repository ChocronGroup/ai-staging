import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jobId = req.query.jobId;
  if (!jobId) {
    return res.status(400).json({ error: "jobId missing" });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const job = await openai.images.retrieve(jobId);

    if (job.status === "succeeded") {
      const b64 = job.output[0].b64_json;
      return res.status(200).json({
        status: "done",
        imageUrl: `data:image/png;base64,${b64}`
      });
    }

    if (job.status === "failed") {
      return res.status(500).json({ status: "failed" });
    }

    return res.status(200).json({ status: job.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to check status" });
  }
}
