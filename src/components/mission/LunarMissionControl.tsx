import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./LunarMissionControl.css";

type LunarFeedStatus = "loading" | "connected" | "cached" | "archive";

interface LunarImage {
  id: string;
  title: string;
  description: string;
  dateCreated: string;
  center: string;
  imageUrl: string;
  nasaUrl: string;
}

interface LunarFeedState {
  images: LunarImage[];
  fetchedAt: string;
  status: LunarFeedStatus;
  error: string | null;
}

interface LunarMissionControlProps {
  onBack: () => void;
}

const REFRESH_INTERVAL = 15 * 60 * 1000;
const CACHE_KEY = "cosmic-footprints:lunar-image-library";

const LUNAR_FALLBACK_IMAGES: LunarImage[] = [
  {
    id: "PIA12903",
    title: "LRO Lunar Surface Detail",
    description: "A close orbital view of the Moon's heavily cratered surface from the Lunar Reconnaissance Orbiter Camera archive.",
    dateCreated: "2009-09-03",
    center: "NASA / LRO / Arizona State University",
    imageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia12/pia12903/PIA12903.jpg",
    nasaUrl: "https://science.nasa.gov/photojournal/first-look-apollo-12-and-surveyor-3/",
  },
  {
    id: "PIA14426",
    title: "Action Shot — Fresh Lunar Crater Ejecta",
    description: "LRO imagery of a fresh ejecta blanket around an unnamed lunar crater, showing how impacts reshape the surface.",
    dateCreated: "2017-09-26",
    center: "NASA / GSFC / Arizona State University",
    imageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia14/pia14426/PIA14426.jpg",
    nasaUrl: "https://science.nasa.gov/resource/action-shot/",
  },
];

const HISTORY = [
  {
    id: "apollo-11",
    name: "Apollo 11",
    category: "APOLLO",
    period: "1969",
    site: "Sea of Tranquility",
    status: "FIRST CREWED LUNAR LANDING",
    description: "The first mission to land humans on the Moon and return them safely to Earth.",
    source: "https://science.nasa.gov/moon/moonwalkers/",
    sourceLabel: "NASA Moonwalkers archive",
  },
  {
    id: "apollo-12",
    name: "Apollo 12",
    category: "APOLLO",
    period: "1969",
    site: "Ocean of Storms",
    status: "PRECISION LANDING",
    description: "Landed near Surveyor 3; astronauts visited the robotic spacecraft and returned selected components to Earth.",
    source: "https://science.nasa.gov/resource/apollo-12-and-surveyor-3/",
    sourceLabel: "NASA Apollo 12 / Surveyor 3 record",
  },
  {
    id: "apollo-14",
    name: "Apollo 14",
    category: "APOLLO",
    period: "1971",
    site: "Fra Mauro",
    status: "THIRD CREWED LANDING",
    description: "Explored the Fra Mauro formation and deployed a lunar surface science package.",
    source: "https://science.nasa.gov/moon/moonwalkers/",
    sourceLabel: "NASA Moonwalkers archive",
  },
  {
    id: "apollo-15",
    name: "Apollo 15",
    category: "APOLLO",
    period: "1971",
    site: "Hadley–Apennine",
    status: "FIRST LUNAR ROVER",
    description: "Introduced the Lunar Roving Vehicle and expanded geological exploration around the landing site.",
    source: "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html",
    sourceLabel: "NASA NSSDCA / Lunar Roving Vehicle",
  },
  {
    id: "apollo-16",
    name: "Apollo 16",
    category: "APOLLO",
    period: "1972",
    site: "Descartes Highlands",
    status: "HIGHLANDS EXPLORATION",
    description: "Used the second Lunar Roving Vehicle to investigate the lunar highlands and collect samples.",
    source: "https://science.nasa.gov/moon/moonwalkers/",
    sourceLabel: "NASA Moonwalkers archive",
  },
  {
    id: "apollo-17",
    name: "Apollo 17",
    category: "APOLLO",
    period: "1972",
    site: "Taurus–Littrow",
    status: "FINAL APOLLO MOONWALK",
    description: "The last crewed lunar landing to date; its rover supported extensive surface exploration.",
    source: "https://www.nasa.gov/missions/apollo/apollo-17-mission-details/",
    sourceLabel: "NASA Apollo 17 mission details",
  },
  {
    id: "surveyor-3",
    name: "Surveyor 3",
    category: "ROBOTIC",
    period: "1967",
    site: "Oceanus Procellarum",
    status: "ROBOTIC LANDER / VISITED BY APOLLO 12",
    description: "Tested soft-landing technology and lunar soil. Apollo 12 astronauts later visited the silent lander.",
    source: "https://science.nasa.gov/mission/surveyor-3/",
    sourceLabel: "NASA Surveyor 3 mission",
  },
  {
    id: "lunar-roving-vehicle",
    name: "Lunar Roving Vehicle",
    category: "SURFACE SYSTEMS",
    period: "1971–1972",
    site: "Apollo 15, 16 and 17",
    status: "THREE VEHICLES LEFT ON THE MOON",
    description: "Three battery-powered rovers travelled a combined 90.4 km across the lunar surface.",
    source: "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html",
    sourceLabel: "NASA NSSDCA mission record",
  },
  {
    id: "alsep",
    name: "ALSEP",
    category: "SURFACE SYSTEMS",
    period: "1969–1977",
    site: "Apollo 12, 14, 15, 16 and 17",
    status: "SCIENCE OPERATIONS ENDED IN 1977",
    description: "Long-running experiment stations studied moonquakes, heat flow, magnetic fields and the lunar environment.",
    source: "https://ntrs.nasa.gov/api/citations/19790014808/downloads/19790014808.pdf",
    sourceLabel: "NASA ALSEP termination report",
  },
  {
    id: "artemis-ii",
    name: "Artemis II",
    category: "ARTEMIS",
    period: "April 1–10, 2026",
    site: "Crewed lunar flyby",
    status: "COMPLETED",
    description: "The first crewed Artemis flight carried four astronauts around the Moon; it was a flyby, not a lunar landing.",
    source: "https://www.nasa.gov/mission/artemis-ii/",
    sourceLabel: "NASA Artemis II mission",
  },
];

const FILTERS = ["ALL", "APOLLO", "ROBOTIC", "SURFACE SYSTEMS", "ARTEMIS"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readImageRecords(payload: unknown): LunarImage[] {
  const root = asRecord(payload);
  if (!root) return [];

  if (Array.isArray(root.items)) {
    return root.items.map((value) => {
      const item = asRecord(value);
      if (!item) return null;
      return {
        id: String(item.id ?? ""),
        title: String(item.title ?? "NASA lunar image"),
        description: String(item.description ?? ""),
        dateCreated: String(item.dateCreated ?? ""),
        center: String(item.center ?? "NASA"),
        imageUrl: String(item.imageUrl ?? ""),
        nasaUrl: String(item.nasaUrl ?? "https://images.nasa.gov/"),
      };
    }).filter((item): item is LunarImage => Boolean(item && item.id && item.imageUrl))
      .sort((a, b) => Date.parse(b.dateCreated) - Date.parse(a.dateCreated));
  }

  const collection = asRecord(root.collection);
  const records = Array.isArray(collection?.items) ? collection.items : [];

  return records.map((value) => {
    const record = asRecord(value);
    const metadata = record && Array.isArray(record.data) ? asRecord(record.data[0]) : null;
    const links = record && Array.isArray(record.links) ? record.links : [];
    const preview = links.map(asRecord).find((link) => link?.rel === "preview" && typeof link.href === "string")
      ?? links.map(asRecord).find((link) => typeof link?.href === "string");
    const id = typeof metadata?.nasa_id === "string" ? metadata.nasa_id : "";
    if (!metadata || !preview || typeof preview.href !== "string" || !id) return null;

    return {
      id,
      title: String(metadata.title ?? "NASA lunar image"),
      description: String(metadata.description ?? ""),
      dateCreated: String(metadata.date_created ?? ""),
      center: String(metadata.center ?? "NASA"),
      imageUrl: preview.href,
      nasaUrl: "https://images.nasa.gov/details/" + encodeURIComponent(id),
    };
  }).filter((item): item is LunarImage => Boolean(item))
    .sort((a, b) => Date.parse(b.dateCreated) - Date.parse(a.dateCreated));
}

function readCachedImages(): LunarImage[] {
  try {
    const value = localStorage.getItem(CACHE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as { images?: LunarImage[] };
    return Array.isArray(parsed.images) ? parsed.images : [];
  } catch {
    return [];
  }
}

async function fetchLunarImages(signal: AbortSignal): Promise<LunarImage[]> {
  let payload: unknown;

  try {
    const proxy = await fetch("/api/nasa-images?collection=moon", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!proxy.ok) throw new Error("NASA image proxy returned HTTP " + proxy.status);
    payload = await proxy.json();
  } catch (proxyError) {
    if (signal.aborted) throw proxyError;
    const url = new URL("https://images-api.nasa.gov/search");
    url.searchParams.set("q", "Lunar Reconnaissance Orbiter lunar surface");
    url.searchParams.set("media_type", "image");
    url.searchParams.set("page_size", "12");
    url.searchParams.set("year_start", "2009");
    url.searchParams.set("year_end", String(new Date().getUTCFullYear()));
    const direct = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!direct.ok) throw new Error("NASA Image Library returned HTTP " + direct.status, { cause: proxyError });
    payload = await direct.json();
  }

  return readImageRecords(payload);
}

function formatDate(value: string): string {
  if (!value) return "DATE NOT PROVIDED";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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

function statusLabel(status: LunarFeedStatus): string {
  if (status === "connected") return "NASA LIBRARY CONNECTED";
  if (status === "cached") return "CACHED NASA ARCHIVE";
  if (status === "loading") return "SEARCHING NASA ARCHIVE";
  return "CURATED NASA FALLBACK";
}

export function LunarMissionControl({ onBack }: LunarMissionControlProps) {
  const [feed, setFeed] = useState<LunarFeedState>({
    images: LUNAR_FALLBACK_IMAGES,
    fetchedAt: "",
    status: "archive",
    error: null,
  });
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const refreshImages = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRefreshing(true);
    setFeed((current) => ({
      ...current,
      status: current.images.length > 0 ? current.status : "loading",
    }));

    try {
      const images = await fetchLunarImages(controller.signal);
      if (controller.signal.aborted) return;

      if (images.length === 0) {
        throw new Error("NASA Image Library returned no lunar image records.");
      }

      const fetchedAt = new Date().toISOString();
      const snapshot = { images, fetchedAt };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // The live NASA library results remain visible without browser storage.
      }

      setFeed({
        ...snapshot,
        status: "connected",
        error: null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const cached = readCachedImages();
      if (cached.length > 0) {
        setFeed({
          images: cached,
          fetchedAt: new Date().toISOString(),
          status: "cached",
          error: "NASA's image library could not be refreshed. Showing the last successful archive results.",
        });
      } else {
        setFeed({
          images: LUNAR_FALLBACK_IMAGES,
          fetchedAt: new Date().toISOString(),
          status: "archive",
          error: error instanceof Error
            ? error.message + " Showing source-linked NASA Photojournal images."
            : "NASA's image library is unavailable. Showing source-linked NASA Photojournal images.",
        });
      }
    } finally {
      if (!controller.signal.aborted) {
        setLastCheckedAt(new Date().toISOString());
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void refreshImages();
    }, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshImages();
    }, REFRESH_INTERVAL);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refreshImages]);

  const visibleHistory = useMemo(
    () => HISTORY.filter((mission) => activeFilter === "ALL" || mission.category === activeFilter),
    [activeFilter],
  );
  const gallery = useMemo(() => feed.images.slice(1, 5), [feed.images]);
  const featuredImage = feed.images[0] ?? LUNAR_FALLBACK_IMAGES[0];

  return (
    <section className="lunar-control-layout" aria-label="Lunar mission control dashboard">
      <div className="lunar-control-topline">
        <p className="archive-eyebrow">
          <span className="kicker-line" />
          LUNAR / MISSION INTELLIGENCE
        </p>
        <button type="button" className="archive-back" onClick={onBack}>
          ← BACK TO ARCHIVE
        </button>
      </div>

      <header className="lunar-control-hero">
        <div className="lunar-control-hero-copy">
          <p className="lunar-control-overline">NASA PUBLIC DATA / LUNAR EXPLORATION</p>
          <h1>LUNAR <span>MISSION CONTROL.</span></h1>
          <p>
            Explore lunar imagery, NASA's active mapping orbiter, interactive surface maps,
            and the historic missions that shaped human exploration of the Moon.
          </p>
          <div className="lunar-control-hero-meta">
            <span><i /> PUBLIC NASA SOURCES</span>
            <span>LRO / ACTIVE MISSION</span>
            <span>IMAGE REFRESH / 15 MIN</span>
          </div>
        </div>
        <div className="lunar-control-hero-art" aria-hidden="true">
          <span className="lunar-orbit lunar-orbit-one" />
          <span className="lunar-orbit lunar-orbit-two" />
          <span className="lunar-hero-moon" />
          <span className="lunar-hero-star lunar-star-one">✦</span>
          <span className="lunar-hero-star lunar-star-two">✧</span>
          <span className="lunar-hero-code">LUNA / 01</span>
        </div>
      </header>

      <div className="lunar-control-data-note">
        <span className="lunar-note-icon">i</span>
        <p>
          <strong>DATA TRANSPARENCY</strong>
          Images come from NASA's public Image and Video Library and Photojournal.
          They are archive records, not a continuous live camera feed. NASA's Moon maps
          use spacecraft observations; this dashboard does not invent live orbital positions.
        </p>
      </div>

      <div className="lunar-control-dashboard">
        <section className="lunar-imagery-panel">
          <div className="lunar-section-heading">
            <div>
              <p className="lunar-section-index">01 / LUNAR IMAGE ARCHIVE</p>
              <h2>Latest lunar imagery</h2>
              <p>NASA Image and Video Library · LRO / lunar surface</p>
            </div>
            <a href="https://images.nasa.gov/search?q=Lunar%20Reconnaissance%20Orbiter&media=images" target="_blank" rel="noreferrer">
              OPEN NASA IMAGE LIBRARY ↗
            </a>
          </div>

          <div className="lunar-imagery-toolbar">
            <span className={"lunar-feed-status status-" + feed.status}>
              <i /> {statusLabel(feed.status)}
            </span>
            <button type="button" className="lunar-refresh-button" onClick={() => void refreshImages()} disabled={refreshing}>
              <span className={refreshing ? "is-spinning" : ""}>↻</span>
              {refreshing ? "CHECKING" : "REFRESH IMAGERY"}
            </button>
          </div>

          {feed.error && (
            <div className="lunar-archive-notice">
              <strong>{feed.status === "archive" ? "NASA LIBRARY FALLBACK" : "ARCHIVE NOTE"}</strong>
              <span>{feed.status === "archive" ? "Showing verified NASA Photojournal images so this panel never appears empty." : feed.error}</span>
            </div>
          )}

          {feed.status === "loading" && feed.images.length === 0 ? (
            <div className="lunar-loading-state" role="status">
              <span className="lunar-loading-orbit" />
              <strong>SEARCHING LUNAR IMAGE ARCHIVE</strong>
              <small>Requesting public image records from NASA.</small>
            </div>
          ) : (
            <>
              <a className="lunar-feature-image" href={featuredImage.nasaUrl} target="_blank" rel="noreferrer">
                <img
                  src={featuredImage.imageUrl}
                  alt={featuredImage.title}
                  loading="eager"
                  onError={(event) => {
                    if (event.currentTarget.src !== LUNAR_FALLBACK_IMAGES[0].imageUrl) {
                      event.currentTarget.src = LUNAR_FALLBACK_IMAGES[0].imageUrl;
                      return;
                    }
                    event.currentTarget.style.opacity = "0";
                  }}
                />
                <span className="lunar-image-tag">{feed.status === "archive" ? "CURATED NASA PHOTOJOURNAL IMAGE" : "NASA PUBLIC IMAGE RECORD"}</span>
                <span className="lunar-image-open">VIEW SOURCE ↗</span>
              </a>

              <div className="lunar-image-caption">
                <div>
                  <span className="lunar-caption-label">IMAGE RECORD / {featuredImage.id}</span>
                  <h3>{featuredImage.title}</h3>
                  <p>{featuredImage.description}</p>
                </div>
              </div>

              <div className="lunar-image-metadata">
                <div><span>NASA RECORD DATE</span><strong>{formatDate(featuredImage.dateCreated)}</strong></div>
                <div><span>NASA CENTER / CREDIT</span><strong>{featuredImage.center}</strong></div>
                <div><span>IMAGES LOADED</span><strong>{String(feed.images.length).padStart(2, "0")}</strong></div>
              </div>

              {gallery.length > 0 && (
                <div className="lunar-image-gallery">
                  {gallery.map((image) => (
                    <a href={image.nasaUrl} target="_blank" rel="noreferrer" key={image.id} title={image.title}>
                      <img src={image.imageUrl} alt={image.title} loading="lazy" />
                      <span>{image.id}</span>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="lunar-image-source">
            <span>DATA SOURCE</span>
            <strong>NASA IMAGE AND VIDEO LIBRARY / PHOTOJOURNAL</strong>
            <span>{feed.status === "connected" ? "PUBLIC LIBRARY RESULTS" : feed.status === "cached" ? "CACHED LIBRARY RESULTS" : "SOURCE-LINKED ARCHIVE FALLBACK"}</span>
          </div>
        </section>

        <aside className="lunar-side-stack">
          <section className="lunar-orbiter-card">
            <p className="lunar-section-index">02 / ORBITAL MAPPING MISSION</p>
            <div className="lunar-orbiter-heading">
              <div>
                <span className="lunar-active-dot" />
                <span>ACTIVE MISSION</span>
              </div>
              <span className="lunar-orbiter-code">LRO / 2009—</span>
            </div>
            <h2>Lunar Reconnaissance <span>Orbiter</span></h2>
            <p className="lunar-orbiter-description">
              NASA's LRO has studied the Moon from close orbit since 2009, mapping the surface
              and measuring temperature, composition and radiation to support science and exploration.
            </p>
            <div className="lunar-orbiter-facts">
              <div><span>LAUNCH</span><strong>18 JUN 2009</strong></div>
              <div><span>TARGET</span><strong>EARTH'S MOON</strong></div>
              <div><span>MISSION TYPE</span><strong>ORBITER / SCIENCE</strong></div>
            </div>
            <a className="lunar-map-link" href="https://science.nasa.gov/mission/lro/" target="_blank" rel="noreferrer">
              OPEN OFFICIAL LRO MISSION PAGE <span>↗</span>
            </a>
          </section>

          <section className="lunar-maps-card">
            <p className="lunar-section-index">03 / POSITION &amp; SURFACE DATA</p>
            <h2>Explore the Moon</h2>
            <p>Open NASA and LROC's interactive tools to inspect the lunar surface using real spacecraft data.</p>
            <a className="lunar-map-resource" href="https://trek.nasa.gov/moon/" target="_blank" rel="noreferrer">
              <span className="lunar-map-resource-number">01</span>
              <span><strong>NASA MOON TREK</strong><small>3D globe, elevation, slope and lighting layers</small></span>
              <span>↗</span>
            </a>
            <a className="lunar-map-resource" href="https://quickmap.lroc.asu.edu/" target="_blank" rel="noreferrer">
              <span className="lunar-map-resource-number">02</span>
              <span><strong>LROC QUICKMAP</strong><small>High-resolution lunar imagery and landing sites</small></span>
              <span>↗</span>
            </a>
            <a className="lunar-map-resource" href="https://eyes.nasa.gov/apps/solar-system/#/moon" target="_blank" rel="noreferrer">
              <span className="lunar-map-resource-number">03</span>
              <span><strong>NASA EYES</strong><small>Explore the Moon and spacecraft in 3D</small></span>
              <span>↗</span>
            </a>
            <p className="lunar-map-disclaimer">These are official interactive resources, not a live GPS tracker for the orbiter.</p>
          </section>
        </aside>
      </div>

      <section className="lunar-history-section">
        <div className="lunar-history-heading">
          <div>
            <p className="lunar-section-index">04 / HISTORICAL MISSION TRACKING</p>
            <h2>Every footprint tells a story.</h2>
            <p>Browse the crewed landings, robotic explorers, long-running experiments and Artemis missions.</p>
          </div>
          <div className="lunar-history-stats">
            <div><strong>06</strong><span>APOLLO LANDINGS</span></div>
            <div><strong>03</strong><span>LUNAR ROVERS</span></div>
            <div><strong>05</strong><span>ALSEP STATIONS</span></div>
          </div>
        </div>

        <div className="lunar-history-filters" aria-label="Filter lunar missions">
          {FILTERS.map((filter) => (
            <button
              type="button"
              key={filter}
              className={activeFilter === filter ? "is-active" : ""}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === "ALL" ? "ALL MISSIONS" : filter}
            </button>
          ))}
        </div>

        <div className="lunar-history-grid">
          {visibleHistory.map((mission, index) => (
            <article className="lunar-history-card" key={mission.id}>
              <div className="lunar-history-card-top">
                <span>{String(index + 1).padStart(2, "0")} / {mission.category}</span>
                <span>{mission.period}</span>
              </div>
              <h3>{mission.name}</h3>
              <p className="lunar-history-site">{mission.site}</p>
              <p className="lunar-history-description">{mission.description}</p>
              <div className="lunar-history-status">{mission.status}</div>
              <a href={mission.source} target="_blank" rel="noreferrer">
                {mission.sourceLabel} <span>↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="lunar-artemis-section">
        <div className="lunar-artemis-copy">
          <p className="lunar-section-index">05 / THE NEXT CHAPTER</p>
          <h2>Artemis <span>program roadmap</span></h2>
          <p>
            Artemis II completed its crewed lunar flyby in April 2026. NASA's published
            roadmap places an Artemis III systems demonstration in low Earth orbit in 2027
            and targets the first Artemis lunar landing with Artemis IV in early 2028.
          </p>
          <a href="https://www.nasa.gov/artemis-ii-news-and-updates/" target="_blank" rel="noreferrer">
            CHECK NASA PROGRAM UPDATES ↗
          </a>
        </div>
        <div className="lunar-artemis-timeline">
          <div className="lunar-artemis-step is-complete">
            <span className="lunar-artemis-marker">✓</span>
            <div><span>APR 01–10, 2026 / COMPLETED</span><strong>ARTEMIS II</strong><p>Four astronauts completed a crewed lunar flyby aboard Orion.</p></div>
          </div>
          <div className="lunar-artemis-step">
            <span className="lunar-artemis-marker">03</span>
            <div><span>NASA TARGET / 2027</span><strong>ARTEMIS III</strong><p>Planned low Earth orbit demonstration to test systems for future lunar missions.</p></div>
          </div>
          <div className="lunar-artemis-step">
            <span className="lunar-artemis-marker">04</span>
            <div><span>NASA TARGET / EARLY 2028</span><strong>ARTEMIS IV</strong><p>NASA's current target for the first Artemis crewed lunar landing.</p></div>
          </div>
          <p className="lunar-artemis-footnote">Future dates are NASA planning targets and may change. This panel is a roadmap, not a launch countdown.</p>
        </div>
      </section>

      <div className="lunar-control-bottomline">
        <span>LAST BROWSER CHECK / {formatLocal(lastCheckedAt)} LOCAL</span>
        <span>COSMIC FOOTPRINTS / LUNAR MISSION INTELLIGENCE</span>
        <span>NASA DATA / {statusLabel(feed.status)}</span>
      </div>

      <footer className="lunar-control-footer">
        <span>NASA SOURCES ARE LINKED DIRECTLY</span>
        <span>ARCHIVE IMAGES AND MISSION HISTORY ARE NOT LIVE TELEMETRY</span>
      </footer>
    </section>
  );
}
