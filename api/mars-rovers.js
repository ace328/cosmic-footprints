const NASA_FEEDS = {
  perseverance:
    "https://mars.nasa.gov/rss/api/?ver=1.2&feed=raw_images&feedtype=json&category=mars2020&num=12&page=0&order=sol%20desc",
  curiosity:
    "https://mars.nasa.gov/api/v1/raw_image_items/?order=sol%20desc,instrument_sort%20desc,sample_type_sort%20desc,date_taken%20desc&per_page=12&page=0&extended=thumbnail::sample_type::noteq",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const rover = typeof req.query?.rover === "string" ? req.query.rover : "";
  const nasaUrl = NASA_FEEDS[rover];

  if (!nasaUrl) {
    return res.status(400).json({ error: "Choose Perseverance or Curiosity." });
  }

  try {
    const upstream = await fetch(nasaUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Cosmic-Footprints-Mission-Control/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return res.status(502).json({
        error: "NASA's public raw-image feed is temporarily unavailable.",
        upstreamStatus: upstream.status,
      });
    }

    const payload = await upstream.json();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=900",
    );
    res.setHeader("X-Data-Source", "NASA Mars raw-image archive");
    res.setHeader("X-Rover-Feed", rover);

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: "Unable to retrieve the NASA rover feed.",
      detail:
        error instanceof Error ? error.message : "Unknown upstream error.",
    });
  }
}
