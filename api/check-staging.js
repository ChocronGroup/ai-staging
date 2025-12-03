import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const job = await client.images.jobs.retrieve(jobId);

    if (job.status === "succeeded") {
      return res.status(200).json({
        status: "done",
        imageUrl: job.result[0].url
      });
    }

    if (job.status === "failed") {
      return res.status(200).json({
        status: "failed"
      });
    }

    return res.status(200).json({
      status: job.status
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
