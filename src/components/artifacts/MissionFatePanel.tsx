import type { Artifact } from "../../data/artifacts";
import { getMissionEndurance, getMissionFate } from "../../data/missionDetails";

interface MissionFatePanelProps {
  artifact: Artifact;
}

export function MissionFatePanel({ artifact }: MissionFatePanelProps) {
  const fate = getMissionFate(artifact);
  const endurance = getMissionEndurance(artifact);
  if (!fate && !endurance) return null;

  const ratio = endurance
    ? Math.min(100, (endurance.achieved / Math.max(endurance.planned, endurance.achieved)) * 100)
    : 0;

  return (
    <section className="mission-fate-panel" aria-labelledby="mission-fate-title">
      {fate && (
        <>
          <div className="mission-fate-heading">
            <p className="story-section-index">THE FINAL CHAPTER / MISSION STATUS</p>
            <span className="mission-fate-status">{fate.statusLabel}</span>
            <h2 id="mission-fate-title">THE LAST SIGNAL</h2>
            <p className="mission-fate-subtitle">WHEN THE MISSION WENT SILENT</p>
          </div>

          <div className="mission-fate-grid">
            <div className="mission-fate-cell">
              <span>{fate.lastKnownSignalLabel}</span>
              <p>{fate.lastKnownSignal}</p>
            </div>
            <div className="mission-fate-cell">
              <span>{fate.officialEndLabel}</span>
              <p>{fate.officialEnd}</p>
            </div>
            <div className="mission-fate-cell">
              <span>WHY IT ENDED</span>
              <p>{fate.reason}</p>
            </div>
            <div className="mission-fate-cell">
              <span>FINAL RESTING PLACE</span>
              <p>{fate.restingPlace}</p>
              <small className={"mission-location-certainty is-" + fate.locationConfidence}>
                {fate.locationConfidence === "known"
                  ? "LOCATION CONFIRMED"
                  : fate.locationConfidence === "partial"
                    ? "PARTLY CONFIRMED"
                    : "EXACT LOCATION UNKNOWN"}
              </small>
            </div>
          </div>
          <a className="mission-fate-source" href={fate.sourceUrl} target="_blank" rel="noreferrer">
            {fate.sourceLabel} <span aria-hidden="true">↗</span>
          </a>
        </>
      )}

      {endurance && (
        <div className="mission-endurance">
          <p className="story-section-index">MISSION ENDURANCE / PLANNED VS ACHIEVED</p>
          <h3>{endurance.label}</h3>
          <p>{endurance.explanation}</p>
          <div className="mission-endurance-bars">
            <div className="mission-endurance-row">
              <span>PLANNED</span>
              <strong>{endurance.planned.toLocaleString()} {endurance.unit}</strong>
              <div className="mission-endurance-track"><i style={{ width: ((endurance.planned / endurance.achieved) * 100) + "%" }} /></div>
            </div>
            <div className="mission-endurance-row is-achieved">
              <span>ACHIEVED</span>
              <strong>{endurance.achieved.toLocaleString()} {endurance.unit}</strong>
              <div className="mission-endurance-track"><i style={{ width: ratio + "%" }} /></div>
            </div>
          </div>
          <a className="mission-fate-source" href={endurance.sourceUrl} target="_blank" rel="noreferrer">
            {endurance.sourceLabel} <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </section>
  );
}
