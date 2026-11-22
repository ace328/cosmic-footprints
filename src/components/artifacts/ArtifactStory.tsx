import type { Artifact } from "../../data/artifacts";
import { MissionDataChart } from "./MissionDataChart";
import { MissionFatePanel } from "./MissionFatePanel";
import { IngenuityFlightReplay } from "./IngenuityFlightReplay";

interface ArtifactStoryProps {
  artifact: Artifact;
  onBack: () => void;
}

export function ArtifactStory({
  artifact,
  onBack,
}: ArtifactStoryProps) {
  return (
    <article className="story-panel">
      <div className="story-panel-topbar">
        <button
          type="button"
          className="archive-back"
          onClick={onBack}
        >
          ← BACK TO SURFACE
        </button>

        <span>FIELD RECORD / {artifact.destination.toUpperCase()}</span>
      </div>

      <header className="story-panel-heading">
        <p className="archive-eyebrow">
          {artifact.category.toUpperCase()} / {artifact.year}
        </p>

        <h1>{artifact.name}</h1>

        <p className="story-panel-tagline">{artifact.tagline}</p>

        <p className="story-panel-intro">{artifact.description}</p>
      </header>

      <figure className="story-panel-figure">
        <img src={artifact.image} alt={artifact.imageAlt} />

        <figcaption>
          {artifact.imageCaption} Credit: {artifact.imageCredit}.
          {artifact.imageType === "artist-concept" && (
            <strong> Artist's concept.</strong>
          )}
        </figcaption>
      </figure>

      <div className="story-panel-status">
        <div>
          <span className="status-indicator" />
          <span>MISSION STATUS</span>
          <strong>{artifact.status}</strong>
        </div>

        <p>{artifact.statusDetail}</p>
      </div>

      <section className="story-panel-section">
        <p className="story-section-index">01 / THE BEGINNING</p>
        <h2>Why was it sent?</h2>
        <p>{artifact.purpose}</p>
      </section>

      <section className="story-panel-section">
        <p className="story-section-index">02 / THE JOURNEY</p>
        <h2>Its story</h2>

        {artifact.story.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      <section className="story-panel-section">
        <p className="story-section-index">03 / SCIENCE LEGACY</p>
        <h2>What did it teach us?</h2>

        <ul className="story-discovery-list">
          {artifact.discoveries.map((discovery) => (
            <li key={discovery}>
              <span>✦</span>
              {discovery}
            </li>
          ))}
        </ul>
      </section>

      {artifact.id === "ingenuity" && <IngenuityFlightReplay />}

      {artifact.dataVisualization && (
        <MissionDataChart data={artifact.dataVisualization} />
      )}

      <MissionFatePanel artifact={artifact} />

      <section className="story-panel-section">
        <p className="story-section-index">05 / MISSION TIMELINE</p>
        <h2>A journey through time.</h2>

        <div className="story-timeline">
          {artifact.timeline.map((milestone, index) => (
            <div
              className="story-timeline-item"
              key={milestone.date + "-" + index}
            >
              <div className="story-timeline-rail">
                <span />
              </div>

              <div>
                <span className="story-timeline-date">{milestone.date}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="story-panel-sources">
        <p className="story-section-index">06 / NASA SOURCE RECORDS</p>
        <h2>Explore further.</h2>
        <p>Continue with the original mission history and NASA resources.</p>

        <div className="story-source-links">
          {artifact.sources.map((source) => (
            <a
              href={source.url}
              key={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>{source.label}</span>
              <span>↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="story-panel-footer">
        COSMIC FOOTPRINTS / THE MACHINES MAY BE SILENT. THEIR DISCOVERIES AREN'T.
      </footer>
    </article>
  );
}
