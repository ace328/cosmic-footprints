import { useMemo, useState } from "react";

const FLIGHT_COUNT = 72;

function flightSummary(flight: number) {
  if (flight === 1) {
    return {
      title: "A new kind of first",
      date: "April 19, 2021",
      description: "Ingenuity completed the first powered, controlled flight on another planet.",
    };
  }
  if (flight === 72) {
    return {
      title: "The final flight",
      date: "January 18, 2024",
      description: "Flight 72 ended with rotor-blade damage. Ingenuity could no longer fly, although it remained upright and in communication when NASA announced the mission's end.",
    };
  }
  return {
    title: flight <= 5 ? "Technology demonstration" : "Extended mission",
    date: flight <= 5 ? "April–May 2021" : "2021–2024",
    description: flight <= 5
      ? "This flight belongs to the original five-flight technology demonstration. Ingenuity proved powered flight was possible in Mars' thin atmosphere."
      : "After the original demonstration, Ingenuity continued flying to support Perseverance with aerial scouting and operational experience. This selector shows the flight number, not a measured route for that individual flight.",
  };
}

export function IngenuityFlightReplay() {
  const [flight, setFlight] = useState(1);
  const summary = useMemo(() => flightSummary(flight), [flight]);
  const progress = (flight - 1) / (FLIGHT_COUNT - 1);
  const markerX = 10 + progress * 80;
  const markerY = 54 - Math.sin(progress * Math.PI * 2) * 18 - progress * 12;

  return (
    <section className="ingenuity-replay" aria-labelledby="ingenuity-replay-title">
      <p className="story-section-index">FLIGHT ARCHIVE / 01–72</p>
      <h2 id="ingenuity-replay-title">INGENUITY FLIGHT REPLAY</h2>
      <p className="ingenuity-replay-intro">
        Scrub through the 72-flight story of the first aircraft to achieve powered, controlled flight on another planet.
      </p>
      <div className="ingenuity-flight-visual">
        <svg viewBox="0 0 100 72" role="img" aria-label="Illustrative helicopter flight arc from takeoff to landing; not a measured flight track">
          <path d="M5 58 H95" className="ingenuity-ground" />
          <path d="M10 54 C22 8 36 18 49 36 S76 64 90 42" className="ingenuity-flight-path" />
          <circle cx="10" cy="54" r="3" className="ingenuity-flight-point" />
          <circle cx="90" cy="42" r="3" className="ingenuity-flight-point is-landing" />
          <g transform={`translate(${markerX} ${markerY})`} className="ingenuity-helicopter-marker">
            <path d="M-5 0 H5 M0 -2 V3 M-2 3 H2 M-7 -4 H7" />
            <circle cx="0" cy="0" r="1.8" />
          </g>
        </svg>
        <div className="ingenuity-flight-labels"><span>TAKEOFF</span><span>FLIGHT</span><span>LANDING</span></div>
        <small>Illustrative flight arc · not an individual NASA telemetry track</small>
      </div>
      <div className="ingenuity-flight-selector">
        <div className="ingenuity-flight-number"><span>SELECTED FLIGHT</span><strong>{String(flight).padStart(2, "0")} <small>/ 72</small></strong></div>
        <input
          aria-label="Select Ingenuity flight number"
          type="range"
          min="1"
          max={FLIGHT_COUNT}
          step="1"
          value={flight}
          onChange={(event) => setFlight(Number(event.target.value))}
        />
        <div className="ingenuity-flight-range"><span>01 · FIRST FLIGHT</span><span>72 · FINAL FLIGHT</span></div>
      </div>
      <div className="ingenuity-flight-detail" aria-live="polite">
        <span>{summary.date}</span>
        <h3>{summary.title}</h3>
        <p>{summary.description}</p>
      </div>
      <a className="mission-fate-source" href="https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/" target="_blank" rel="noreferrer">
        NASA — Ingenuity mission ends <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
