import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RoverId = "perseverance" | "curiosity";
type FeedStatus = "loading" | "connected" | "cached" | "archive" | "unavailable";

interface RoverImage {
  id: string;
  title: string;
  caption: string;
  sol: number | null;
  camera: string;
  dateTaken: string | null;
  dateReceived: string | null;
  imageUrl: string;
  nasaUrl: string;
}

interface FeedSnapshot {
  images: RoverImage[];
  fetchedAt: string;
  totalResults: number | null;
}

interface RoverFeedState extends FeedSnapshot {
  status: FeedStatus;
  error: string | null;
}

interface MissionControlProps {
  onBack: () => void;
}

const REFRESH_INTERVAL = 15 * 60 * 1000;
const CACHE_PREFIX = "cosmic-footprints:nasa-rover-feed:";

const ROVERS: Record<RoverId, {
  name: string;
  mission: string;
  location: string;
  locationMap: string;
  imageGallery: string;
  apiUrl: string;
  directApiUrl: string;
}> = {
  perseverance: {
    name: "Perseverance",
    mission: "MARS 2020",
    location: "Jezero Crater",
    locationMap: "https://science.nasa.gov/mission/mars-2020-perseverance/location-map/",
    imageGallery: "https://mars.nasa.gov/mars2020/multimedia/raw-images/",
    apiUrl: "/api/mars-rovers?rover=perseverance",
    directApiUrl: "https://mars.nasa.gov/rss/api/?ver=1.2&feed=raw_images&feedtype=json&category=mars2020&num=12&page=0&order=sol%20desc",
  },
  curiosity: {
    name: "Curiosity",
    mission: "MARS SCIENCE LABORATORY",
    location: "Gale Crater",
    locationMap: "https://science.nasa.gov/mission/msl-curiosity/location-map/",
    imageGallery: "https://mars.nasa.gov/msl/multimedia/raw-images/",
    apiUrl: "/api/mars-rovers?rover=curiosity",
    directApiUrl: "https://mars.nasa.gov/api/v1/raw_image_items/?order=sol%20desc,instrument_sort%20desc,sample_type_sort%20desc,date_taken%20desc&per_page=12&page=0&extended=thumbnail::sample_type::noteq",
  },
};

const EMPTY_FEED: RoverFeedState = {
  images: [],
  fetchedAt: "",
  totalResults: null,
  status: "loading",
  error: null,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  const record = asRecord(value);
  if (record) {
    for (const key of ["url", "src", "href", "name", "full_name", "title"]) {
      const nested = record[key];
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
  }

  return null;
}

function toNasaUrl(value: string): string | null {
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://mars.nasa.gov${value}`;
  return null;
}

function findImageUrl(item: Record<string, unknown>): string | null {
  const files = item.image_files;
  const fileRecord = asRecord(files);
  const fileValues = Array.isArray(files)
    ? files
    : fileRecord
      ? Object.values(fileRecord)
      : [];

  const linkValues = Array.isArray(item.links) ? item.links : [];
  const candidates: unknown[] = [
    item.thumbnail,
    item.thumbnail_url,
    item.img_src,
    item.image_url,
    item.image,
    item.image_files,
    item.full_res,
    item.medium,
    item.large,
    ...fileValues,
    ...linkValues,
  ];

  for (const candidate of candidates) {
    const value = asText(candidate);
    if (value) {
      const absoluteUrl = toNasaUrl(value);
      if (absoluteUrl) return absoluteUrl;
    }
  }

  return null;
}

function getImageRecords(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root) return [];

  const candidates = [
    root.images,
    root.items,
    root.raw_image_items,
    root.results,
    asRecord(root.data)?.images,
    asRecord(root.data)?.items,
    asRecord(root.collection)?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }

  return [];
}

function normalizeImages(payload: unknown, rover: RoverId): RoverImage[] {
  const records = getImageRecords(payload);

  return records
    .map((record, index): RoverImage | null => {
      const metadata = Array.isArray(record.data)
        ? asRecord(record.data[0]) ?? record
        : record;
      const item: Record<string, unknown> = { ...metadata, links: record.links };
      const id = asText(item.imageid ?? item.image_id ?? item.id ?? item.product_id ?? item.nasa_id);
      const imageUrl = findImageUrl(item);

      if (!imageUrl) return null;

      const cameraValue = asRecord(item.camera);
      const camera = asText(
        cameraValue?.full_name ??
        cameraValue?.name ??
        item.instrument ??
        item.camera_name ??
        item.camera,
      ) ?? (item.nasa_id ? "NASA Image and Video Library" : "NASA rover camera");

      const solValue = Number(item.sol ?? item.mission_sol);
      const sol = Number.isFinite(solValue) ? solValue : null;
      const title = asText(item.title) ?? `${ROVERS[rover].name} raw image`;
      const dateTaken = asText(
        item.date_taken_utc ??
        item.date_taken ??
        item.date_created,
      );
      const dateReceived = asText(
        item.date_received ??
        item.date_received_utc,
      );
      const caption = asText(item.caption ?? item.description) ?? title;
      const rawNasaUrl = asText(item.link ?? item.web_url);
      const nasaUrl = (rawNasaUrl ? toNasaUrl(rawNasaUrl) : null) ??
        (item.nasa_id && id
          ? `https://images.nasa.gov/details/${encodeURIComponent(id)}`
          : `${ROVERS[rover].imageGallery}${id ? `?id=${encodeURIComponent(id)}` : ""}`);

      return {
        id: id ?? `${rover}-${sol ?? "unknown"}-${index}`,
        title,
        caption,
        sol,
        camera,
        dateTaken,
        dateReceived,
        imageUrl,
        nasaUrl,
      };
    })
    .filter((image): image is RoverImage => Boolean(image))
    .sort((a, b) => {
      if (a.sol !== null && b.sol !== null && a.sol !== b.sol) {
        return b.sol - a.sol;
      }
      const aDate = Date.parse(a.dateReceived ?? a.dateTaken ?? "");
      const bDate = Date.parse(b.dateReceived ?? b.dateTaken ?? "");
      return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
    });
}

const CURIOSITY_ARCHIVE_FALLBACK: RoverImage[] = [
  {
    id: "PIA26700",
    title: "Curiosity Postcard Celebrates Rover's 5,000th Day on Mars",
    caption: "A NASA/JPL-Caltech composite of Curiosity Navcam panoramas captured on Sol 5,000 and Sol 5,003. Blue and yellow tones distinguish the morning and afternoon views; this is an archive image, not a live downlink.",
    sol: 5003,
    camera: "Navigation Cameras (Navcams) / NASA Photojournal",
    dateTaken: "2026-09-02",
    dateReceived: null,
    imageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26700/PIA26700.jpg",
    nasaUrl: "https://science.nasa.gov/photojournal/curiosity-postcard-celebrates-rovers-5000th-day-on-mars/",
  },
  {
    id: "PIA16238",
    title: "Preliminary Self-Portrait of Curiosity",
    caption: "Curiosity used its Mars Hand Lens Imager to assemble this self-portrait at Rocknest in Gale Crater on Sol 84.",
    sol: 84,
    camera: "Mars Hand Lens Imager (MAHLI)",
    dateTaken: "2012-10-31",
    dateReceived: null,
    imageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia16/pia16238/PIA16238.jpg",
    nasaUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA16238",
  },
];

async function fetchCuriosityArchive(signal: AbortSignal): Promise<FeedSnapshot> {
  let payload: unknown;

  try {
    const proxyResponse = await fetch("/api/nasa-images?collection=curiosity", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!proxyResponse.ok) {
      throw new Error("NASA image archive proxy returned HTTP " + proxyResponse.status);
    }
    payload = await proxyResponse.json();
  } catch (proxyError) {
    if (signal.aborted) throw proxyError;
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q", "Curiosity Mars rover");
    url.searchParams.set("media_type", "image");
    url.searchParams.set("page_size", "12");
    url.searchParams.set("year_start", "2012");
    url.searchParams.set("year_end", String(new Date().getUTCFullYear()));
    const directResponse = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!directResponse.ok) {
      throw new Error("NASA Image Library returned HTTP " + directResponse.status, { cause: proxyError });
    }
    payload = await directResponse.json();
  }

  const images = normalizeImages(payload, "curiosity");
  if (images.length === 0) {
    throw new Error("NASA Image Library returned no displayable Curiosity records.");
  }

  return {
    images,
    fetchedAt: new Date().toISOString(),
    totalResults: images.length,
  };
}

function readCachedFeed(rover: RoverId): FeedSnapshot | null {
  try {
    const value = localStorage.getItem(CACHE_PREFIX + rover);
    if (!value) return null;

    const parsed = JSON.parse(value) as FeedSnapshot;
    if (!Array.isArray(parsed.images) || typeof parsed.fetchedAt !== "string") return null;

    return parsed;
  } catch {
    return null;
  }
}

async function fetchRoverFeed(
  rover: RoverId,
  signal: AbortSignal,
): Promise<RoverFeedState> {
  try {
    let payload: unknown;

    try {
      const proxyResponse = await fetch(ROVERS[rover].apiUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal,
      });

      if (!proxyResponse.ok) {
        throw new Error(`NASA proxy returned HTTP ${proxyResponse.status}`);
      }

      payload = await proxyResponse.json();
    } catch (proxyError) {
      if (signal.aborted) throw new Error("NASA feed request was cancelled.", { cause: proxyError });

      // Vite's local development server has no Vercel function runtime.
      // Try NASA's public feed directly for local development or proxy outages.
      const directResponse = await fetch(ROVERS[rover].directApiUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal,
      });

      if (!directResponse.ok) {
        throw new Error(`NASA feed returned HTTP ${directResponse.status}`, { cause: proxyError });
      }

      payload = await directResponse.json();
    }

    const images = normalizeImages(payload, rover);

    if (images.length === 0) {
      throw new Error("NASA returned no displayable image records.");
    }

    const root = asRecord(payload);
    const totalValue = Number(root?.total_results ?? root?.total);
    const snapshot: FeedSnapshot = {
      images,
      fetchedAt: new Date().toISOString(),
      totalResults: Number.isFinite(totalValue) ? totalValue : null,
    };

    try {
      localStorage.setItem(CACHE_PREFIX + rover, JSON.stringify(snapshot));
    } catch {
      // The live feed remains usable when browser storage is unavailable.
    }

    return { ...snapshot, status: "connected", error: null };
  } catch (error) {
    if (signal.aborted) {
      return { ...EMPTY_FEED, status: "unavailable", error: "Request cancelled." };
    }

    const cached = readCachedFeed(rover);
    if (cached) {
      return {
        ...cached,
        status: "cached",
        error: error instanceof Error ? error.message : "NASA feed unavailable.",
      };
    }

    if (rover === "curiosity") {
      try {
        const archive = await fetchCuriosityArchive(signal);
        return {
          ...archive,
          status: "archive",
          error: "The raw rover feed is unavailable. Showing source-linked NASA Image Library records instead.",
        };
      } catch (archiveError) {
        if (signal.aborted) {
          return { ...EMPTY_FEED, status: "unavailable", error: "Request cancelled." };
        }
        return {
          images: CURIOSITY_ARCHIVE_FALLBACK,
          fetchedAt: new Date().toISOString(),
          totalResults: CURIOSITY_ARCHIVE_FALLBACK.length,
          status: "archive",
          error: archiveError instanceof Error
            ? archiveError.message + " Showing a small, curated NASA Photojournal fallback."
            : "NASA Image Library unavailable. Showing a curated NASA Photojournal fallback.",
        };
      }
    }

    return {
      ...EMPTY_FEED,
      status: "unavailable",
      error: error instanceof Error ? error.message : "NASA feed unavailable.",
    };
  }
}

function formatUtc(value: string | null): string {
  if (!value) return "NOT PROVIDED";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(date) + " UTC";
}

function formatLocal(value: string): string {
  if (!value) return "NOT CHECKED";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "JUST NOW";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function statusLabel(status: FeedStatus): string {
  if (status === "connected") return "NASA FEED CONNECTED";
  if (status === "cached") return "CACHED COPY";
  if (status === "archive") return "NASA IMAGE ARCHIVE";
  if (status === "loading") return "CONTACTING NASA";
  return "FEED UNAVAILABLE";
}

export function MissionControl({ onBack }: MissionControlProps) {
  const [activeRover, setActiveRover] = useState<RoverId>("perseverance");
  const [feeds, setFeeds] = useState<Record<RoverId, RoverFeedState>>({
    perseverance: EMPTY_FEED,
    curiosity: EMPTY_FEED,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const refreshFeeds = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRefreshing(true);
    setFeeds((current) => ({
      perseverance: { ...current.perseverance, status: "loading" },
      curiosity: { ...current.curiosity, status: "loading" },
    }));

    const [perseverance, curiosity] = await Promise.all([
      fetchRoverFeed("perseverance", controller.signal),
      fetchRoverFeed("curiosity", controller.signal),
    ]);

    if (!controller.signal.aborted) {
      setFeeds({ perseverance, curiosity });
      setLastCheckedAt(new Date().toISOString());
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void refreshFeeds();
    }, 0);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshFeeds();
      }
    }, REFRESH_INTERVAL);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refreshFeeds]);

  const rover = ROVERS[activeRover];
  const feed = feeds[activeRover];
  const latestImage = feed.images[0] ?? null;
  const galleryImages = useMemo(() => feed.images.slice(1, 5), [feed.images]);
  const latestSol = useMemo(
    () => feed.images.reduce<number | null>((max, image) => {
      if (image.sol === null) return max;
      return max === null ? image.sol : Math.max(max, image.sol);
    }, null),
    [feed.images],
  );

  return (
    <section className="mission-control-layout" aria-label="Mars mission control dashboard">
      <div className="mission-control-topline">
        <p className="archive-eyebrow">
          <span className="kicker-line" />
          MARS / MISSION INTELLIGENCE
        </p>
        <button type="button" className="archive-back" onClick={onBack}>
          ← BACK TO ARCHIVE
        </button>
      </div>

      <header className="mission-control-hero">
        <div className="mission-control-hero-copy">
          <p className="mission-control-overline">NASA PUBLIC DATA / SURFACE OPERATIONS</p>
          <h1>MISSION <span>CONTROL.</span></h1>
          <p>
            Explore the latest publicly released rover imagery and follow each
            explorer's official NASA traverse map.
          </p>
          <div className="mission-control-hero-meta">
            <span><i /> PUBLIC NASA SOURCES</span>
            <span>NO API KEY REQUIRED</span>
            <span>AUTO-REFRESH / 15 MIN</span>
          </div>
        </div>
        <div className="mission-control-hero-art" aria-hidden="true">
          <span className="mission-control-art-orbit orbit-one" />
          <span className="mission-control-art-orbit orbit-two" />
          <span className="mission-control-art-planet" />
          <span className="mission-control-art-star star-one">✦</span>
          <span className="mission-control-art-star star-two">✧</span>
          <span className="mission-control-art-code">MARS / 04</span>
        </div>
      </header>

      <div className="mission-control-data-note">
        <span className="mission-note-icon">i</span>
        <p>
          <strong>DATA TRANSPARENCY</strong>
          NASA publishes rover images after they are received and released.
          These are latest available public downlinks, not a continuous live video
          or real-time telemetry stream.
        </p>
      </div>

      <div className="mission-control-toolbar">
        <div className="mission-rover-tabs" role="tablist" aria-label="Select Mars rover">
          <button
            type="button"
            role="tab"
            aria-selected={activeRover === "perseverance"}
            className={activeRover === "perseverance" ? "is-active" : ""}
            onClick={() => setActiveRover("perseverance")}
          >
            <span className="rover-tab-index">01</span>
            <span><strong>PERSEVERANCE</strong><small>MARS 2020 / JEZERO CRATER</small></span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRover === "curiosity"}
            className={activeRover === "curiosity" ? "is-active" : ""}
            onClick={() => setActiveRover("curiosity")}
          >
            <span className="rover-tab-index">02</span>
            <span><strong>CURIOSITY</strong><small>MSL / GALE CRATER</small></span>
          </button>
        </div>

        <div className="mission-feed-actions">
          <span className={`mission-feed-status status-${feed.status}`}>
            <i />
            {statusLabel(feed.status)}
          </span>
          <button
            type="button"
            className="mission-refresh-button"
            onClick={() => void refreshFeeds()}
            disabled={refreshing}
          >
            <span className={refreshing ? "is-spinning" : ""} aria-hidden="true">↻</span>
            {refreshing ? "CHECKING" : "REFRESH DATA"}
          </button>
        </div>
      </div>

      <div className="mission-control-grid">
        <section className="mission-imagery-panel">
          <div className="mission-section-heading">
            <div>
              <p className="mission-section-index">01 / PUBLIC IMAGE DOWNLINK</p>
              <h2>Latest surface imagery</h2>
              <p>{rover.name} · {rover.mission}</p>
            </div>
            <a href={rover.imageGallery} target="_blank" rel="noreferrer">
              OPEN NASA GALLERY ↗
            </a>
          </div>

          {feed.status === "archive" && (
            <div className="mission-archive-notice" role="status">
              <strong>LIVE DOWNLINK UNAVAILABLE</strong>
              <span>Showing verified, source-linked NASA archive images. These are historical records, not a live rover feed.</span>
            </div>
          )}

          {feed.status === "loading" && feed.images.length === 0 ? (
            <div className="mission-loading-state" role="status">
              <span className="mission-loading-orbit" />
              <strong>ESTABLISHING DATA LINK</strong>
              <small>Requesting the latest public image records from NASA.</small>
            </div>
          ) : latestImage ? (
            <>
              <a
                className="mission-feature-image"
                href={latestImage.nasaUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={latestImage.imageUrl}
                  alt={latestImage.title}
                  loading="eager"
                  onError={(event) => {
                    if (activeRover === "curiosity" && event.currentTarget.src !== CURIOSITY_ARCHIVE_FALLBACK[0].imageUrl) {
                      event.currentTarget.src = CURIOSITY_ARCHIVE_FALLBACK[0].imageUrl;
                      return;
                    }
                    event.currentTarget.style.opacity = "0";
                  }}
                />
                <span className="mission-image-tag">
                  {feed.status === "archive"
                    ? "NASA ARCHIVE IMAGE / NOT A LIVE DOWNLINK"
                    : feed.status === "cached"
                      ? "LAST SUCCESSFUL LIVE IMAGE"
                      : "LATEST AVAILABLE IMAGE"}
                </span>
                <span className="mission-image-open">VIEW NASA RECORD ↗</span>
              </a>

              <div className="mission-image-caption">
                <div>
                  <span className="mission-caption-label">IMAGE RECORD</span>
                  <h3>{latestImage.title}</h3>
                  <p>{latestImage.caption}</p>
                </div>
                <span className="mission-sol-chip">
                  {latestImage.sol === null ? "SOL —" : `SOL ${latestImage.sol}`}
                </span>
              </div>

              <div className="mission-image-metadata">
                <div><span>CAMERA / INSTRUMENT</span><strong>{latestImage.camera}</strong></div>
                <div><span>CAPTURED ON MARS</span><strong>{formatUtc(latestImage.dateTaken)}</strong></div>
                <div><span>RECEIVED ON EARTH</span><strong>{formatUtc(latestImage.dateReceived)}</strong></div>
              </div>

              {galleryImages.length > 0 && (
                <div className="mission-image-gallery">
                  {galleryImages.map((image) => (
                    <a
                      href={image.nasaUrl}
                      target="_blank"
                      rel="noreferrer"
                      key={image.id}
                      title={image.title}
                    >
                      <img src={image.imageUrl} alt={image.title} loading="lazy" />
                      <span>{image.sol === null ? "MARS IMAGE" : `SOL ${image.sol}`}</span>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mission-unavailable-state" role="status">
              <span>⌁</span>
              <strong>NASA IMAGE FEED UNAVAILABLE</strong>
              <p>
                {feed.error ?? "The public feed could not be reached from this browser."}
                {" "}You can still browse the official NASA image archive.
              </p>
              <a href={rover.imageGallery} target="_blank" rel="noreferrer">
                OPEN NASA IMAGE ARCHIVE ↗
              </a>
            </div>
          )}

          <div className="mission-image-source">
            <span>DATA SOURCE</span>
            <strong>{feed.status === "archive" ? "NASA IMAGE AND VIDEO LIBRARY / PHOTOJOURNAL" : "NASA / JPL RAW IMAGE ARCHIVE"}</strong>
            <span>
              {feed.status === "archive" ? "CURATED ARCHIVE FALLBACK" : feed.status === "cached" ? "CACHED COPY" : feed.status === "connected" ? "DIRECT NASA RESPONSE" : statusLabel(feed.status)}
              {feed.fetchedAt ? ` · FETCHED ${formatLocal(feed.fetchedAt)} LOCAL` : ""}
            </span>
          </div>
        </section>

        <aside className="mission-side-stack">
          <section className="mission-position-card">
            <p className="mission-section-index">02 / POSITION &amp; TRAVERSE</p>
            <span className="mission-position-kicker">OFFICIAL NASA LOCATION RESOURCE</span>
            <h2>Where is <span>{rover.name}?</span></h2>
            <div className="mission-map-preview" aria-hidden="true">
              <span className="mission-map-grid" />
              <span className="mission-map-contour contour-one" />
              <span className="mission-map-contour contour-two" />
              <span className="mission-map-contour contour-three" />
              <span className="mission-map-location">{rover.location.toUpperCase()}</span>
              <span className="mission-map-disclaimer">NASA MAP LINK BELOW / NO LIVE COORDINATE PLOT</span>
            </div>
            <p>
              NASA's interactive map shows the rover's latest reported drive
              endpoints and traverse path. It is updated as new drive data is
              published, not as a continuous GPS beacon.
            </p>
            <a
              className="mission-map-link"
              href={rover.locationMap}
              target="_blank"
              rel="noreferrer"
            >
              OPEN OFFICIAL NASA LOCATION MAP <span>↗</span>
            </a>
          </section>

          <section className="mission-telemetry-card">
            <p className="mission-section-index">03 / DOWNLINK SUMMARY</p>
            <div className="mission-summary-metrics">
              <div>
                <span>LATEST IMAGE SOL</span>
                <strong>{latestSol === null ? "—" : latestSol.toLocaleString("en-US")}</strong>
              </div>
              <div>
                <span>IMAGES LOADED</span>
                <strong>{feed.images.length.toString().padStart(2, "0")}</strong>
              </div>
            </div>
            <div className="mission-checked-row">
              <span>LAST BROWSER CHECK</span>
              <strong>{formatLocal(lastCheckedAt)} LOCAL</strong>
            </div>
            <p className="mission-telemetry-footnote">
              A fetch timestamp only records when this page checked NASA's archive;
              it is not the time the rover transmitted an image.
            </p>
          </section>
        </aside>
      </div>

      <section className="mission-ingenuity-card">
        <div className="mission-ingenuity-mark" aria-hidden="true">✧</div>
        <div>
          <p className="mission-section-index">04 / HISTORICAL FLIGHT ARCHIVE</p>
          <h2>Ingenuity <span>— 72 flights. One extraordinary legacy.</span></h2>
          <p>
            Ingenuity's final flight was January 18, 2024; NASA concluded the
            mission on January 25, 2024. Its flight history is archived, not live.
          </p>
        </div>
        <a href="https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/" target="_blank" rel="noreferrer">
          EXPLORE FLIGHT ARCHIVE ↗
        </a>
      </section>

      <footer className="mission-control-footer">
        <span>COSMIC FOOTPRINTS / MISSION INTELLIGENCE</span>
        <span>NASA DATA IS PRESENTED WITH ITS ORIGINAL UPDATE LIMITATIONS</span>
      </footer>
    </section>
  );
}
