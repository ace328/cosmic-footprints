const COLLECTIONS = {
  curiosity: {
    query: "Curiosity Mars rover",
    yearStart: "2012",
  },
  moon: {
    query: "Lunar Reconnaissance Orbiter lunar surface",
    yearStart: "2009",
  },
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const collection =
    typeof req.query?.collection === "string" ? req.query.collection : "";
  const config = COLLECTIONS[collection];

  if (!config) {
    return res.status(400).json({
      error: "Choose the curiosity or moon image collection.",
    });
  }

  const url = new URL("https://images-api.nasa.gov/search");
  url.searchParams.set("q", config.query);
  url.searchParams.set("media_type", "image");
  url.searchParams.set("page_size", "12");
  url.searchParams.set("year_start", config.yearStart);
  url.searchParams.set("year_end", String(new Date().getUTCFullYear()));

  try {
    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Cosmic-Footprints-Lunar-Mission-Control/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return res.status(502).json({
        error: "NASA's Image and Video Library is temporarily unavailable.",
        upstreamStatus: upstream.status,
      });
    }

    const payload = await upstream.json();
    const records = Array.isArray(payload?.collection?.items)
      ? payload.collection.items
      : [];

    const items = records
      .map((record) => {
        const metadata = Array.isArray(record?.data) ? record.data[0] : null;
        const links = Array.isArray(record?.links) ? record.links : [];
        const preview =
          links.find((link) => link?.rel === "preview" && link?.href) ||
          links.find((link) => link?.href);
        const nasaId =
          typeof metadata?.nasa_id === "string" ? metadata.nasa_id : "";

        if (!metadata || !preview?.href || !nasaId) return null;

        return {
          id: nasaId,
          title: metadata.title || "NASA image archive record",
          description: metadata.description || "",
          dateCreated: metadata.date_created || "",
          center: metadata.center || "NASA",
          imageUrl: preview.href,
          nasaUrl:
            "https://images.nasa.gov/details/" + encodeURIComponent(nasaId),
        };
      })
      .filter(Boolean);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=3600",
    );
    res.setHeader("X-Data-Source", "NASA Image and Video Library");

    return res.status(200).json({
      collection,
      source: "NASA Image and Video Library",
      fetchedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    return res.status(502).json({
      error: "Unable to retrieve NASA's public image archive.",
      detail:
        error instanceof Error ? error.message : "Unknown upstream error.",
    });
  }
}
