import { useEffect, useMemo, useState } from "react";
import type { Artifact } from "../../data/artifacts";
import { getMissionFate } from "../../data/missionDetails";

interface GuidedExplorerProps {
  artifacts: Artifact[];
  onExit: () => void;
}

const missionOrder = ["surveyor-3", "spirit-opportunity", "ingenuity"];
const quiz: Record<string, { question: string; choices: string[]; answer: number; explanation: string }> = {
  "surveyor-3": {
    question: "Who returned to visit Surveyor 3?",
    choices: ["Apollo 12 astronauts", "A Mars rover", "The Space Shuttle crew"],
    answer: 0,
    explanation: "Apollo 12 astronauts landed nearby and recovered selected Surveyor 3 components.",
  },
  "spirit-opportunity": {
    question: "What ended Opportunity's communication?",
    choices: ["A planet-wide dust storm", "A landing accident", "A command to shut down"],
    answer: 0,
    explanation: "A severe dust storm blocked sunlight from Opportunity's solar panels.",
  },
  ingenuity: {
    question: "How many flights did Ingenuity complete?",
    choices: ["5", "27", "72"],
    answer: 2,
    explanation: "Ingenuity completed 72 flights, far beyond its original five-flight technology demonstration.",
  },
};


export function GuidedExplorer({ artifacts, onExit }: GuidedExplorerProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const totalSteps = missionOrder.length * 4 + 1;
  const currentMissionIndex = Math.floor(step / 4);
  const phaseIndex = step % 4;
  const currentId = missionOrder[currentMissionIndex];
  const artifact = useMemo(
    () => artifacts.find((item) => item.id === currentId),
    [artifacts, currentId],
  );
  const fate = artifact ? getMissionFate(artifact) : undefined;
  const currentQuiz = currentId ? quiz[currentId] : undefined;
  const selectedAnswer = currentId ? answers[currentId] : undefined;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  const previous = () => setStep((value) => Math.max(0, value - 1));
  const next = () => setStep((value) => Math.min(totalSteps - 1, value + 1));
  const skipMission = () => setStep((value) => Math.min(totalSteps - 1, (Math.floor(value / 4) + 1) * 4));

  let title = "A ROBOTIC EXPLORER";
  let eyebrow = "01 / MEET THE MISSION";
  let body = "";
  let detail = "";

  if (step >= totalSteps - 1) {
    eyebrow = "THE HUMAN EXPLORATION LEGACY";
    title = "THE MACHINES MAY BE SILENT.";
    body = "Every mission left behind more than hardware. It left measurements, images, discoveries and engineering lessons that help the next generation explore farther.";
    detail = "Their journeys continue through the knowledge they sent home.";
  } else if (artifact && phaseIndex === 0) {
    eyebrow = `${String(currentMissionIndex + 1).padStart(2, "0")} / MEET THE EXPLORER`;
    title = artifact.name;
    body = artifact.purpose;
    detail = artifact.tagline;
  } else if (artifact && phaseIndex === 1) {
    eyebrow = "DISCOVERY / WHAT IT TAUGHT US";
    title = "A DISCOVERY THAT LASTS";
    body = artifact.discoveries[0] ?? artifact.description;
    detail = artifact.story.split("\n\n")[0];
  } else if (artifact && phaseIndex === 2) {
    eyebrow = "THE LAST SIGNAL / HOW THE MISSION ENDED";
    title = fate?.statusLabel ?? artifact.status;
    body = fate?.lastKnownSignal ?? artifact.finalChapter;
    detail = fate?.restingPlace ?? artifact.currentLocation;
  } else if (artifact && currentQuiz) {
    eyebrow = "MISSION CHECK / ONE QUICK QUESTION";
    title = currentQuiz.question;
    body = "";
    detail = currentQuiz.explanation;
  }

  const isQuestion = step < totalSteps - 1 && phaseIndex === 3 && !!currentQuiz;
  const answeredCorrectly = isQuestion && selectedAnswer === currentQuiz?.answer;

  return (
    <div className="guided-explorer-backdrop" role="presentation">
      <section className="guided-explorer" role="dialog" aria-modal="true" aria-labelledby="guided-explorer-title">
        <header className="guided-explorer-header">
          <span> COSMIC FOOTPRINTS / GUIDED FIELD JOURNAL</span>
          <button type="button" onClick={onExit} aria-label="Exit guided journey">×</button>
        </header>
        <div className="guided-explorer-progress">
          <div><span>YOUR 3-MINUTE JOURNEY</span><strong>{Math.min(step + 1, totalSteps)} / {totalSteps}</strong></div>
          <span className="guided-explorer-progress-track"><i style={{ width: (((step + 1) / totalSteps) * 100) + "%" }} /></span>
        </div>
        <div className="guided-explorer-content" key={step}>
          <p className="story-section-index">{eyebrow}</p>
          <h2 id="guided-explorer-title">{title}</h2>
          {body && <p className="guided-explorer-body">{body}</p>}
          {detail && <p className="guided-explorer-detail">{detail}</p>}
          {isQuestion && currentQuiz && (
            <div className="guided-explorer-choices">
              {currentQuiz.choices.map((choice, index) => (
                <button
                  type="button"
                  key={choice}
                  className={selectedAnswer === index ? (index === currentQuiz.answer ? "is-correct" : "is-wrong") : ""}
                  onClick={() => setAnswers((current) => currentId ? ({ ...current, [currentId]: index }) : current)}
                  disabled={selectedAnswer !== undefined}
                >
                  <span>{String.fromCharCode(65 + index)}</span>{choice}
                </button>
              ))}
              {selectedAnswer !== undefined && (
                <p className="guided-explorer-feedback" role="status">
                  {answeredCorrectly ? "Correct — well done!" : "Not quite. Here's the discovery:"} {currentQuiz.explanation}
                </p>
              )}
            </div>
          )}
          {step >= totalSteps - 1 && (
            <div className="guided-explorer-legacy-mark">✦</div>
          )}
        </div>
        <footer className="guided-explorer-footer">
          <button type="button" className="guided-explorer-exit" onClick={onExit}>EXIT JOURNEY</button>
          <div>
            <button type="button" onClick={previous} disabled={step === 0}>BACK</button>
            {step < totalSteps - 1 && phaseIndex !== 3 && (
              <button type="button" onClick={skipMission}>SKIP MISSION</button>
            )}
            <button type="button" className="guided-explorer-next" onClick={step >= totalSteps - 1 ? onExit : next}>
              {step >= totalSteps - 1 ? "FINISH" : "CONTINUE →"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
