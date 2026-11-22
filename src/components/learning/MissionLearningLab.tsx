import { useEffect, useMemo, useState } from "react";
import type { Artifact } from "../../data/artifacts";
import "./mission-learning-lab.css";

interface Question {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
}

const questionBank: Record<string, Question[]> = {
  "surveyor-3": [
    { prompt: "What was Surveyor 3 sent to investigate before astronauts landed?", choices: ["The Moon's magnetic poles only", "Lunar soil and soft-landing conditions", "Water clouds above the Moon"], answer: 1, explanation: "Surveyor 3 tested a soft landing and used a surface sampler to examine lunar soil, helping prepare for later crewed missions." },
    { prompt: "Which crew visited Surveyor 3 in 1969?", choices: ["Apollo 11", "Apollo 12", "Apollo 17"], answer: 1, explanation: "Apollo 12 astronauts Pete Conrad and Alan Bean visited the lander and recovered parts, including its television camera." },
    { prompt: "What makes Surveyor 3 unusual among lunar robots?", choices: ["Humans later returned to examine it", "It flew back to Earth", "It became a communications satellite"], answer: 0, explanation: "Apollo 12 landed nearby. Astronauts walked to Surveyor 3 and brought selected hardware back to Earth." },
  ],
  "lunar-roving-vehicle": [
    { prompt: "Which Apollo missions used Lunar Roving Vehicles?", choices: ["Apollo 11, 12 and 13", "Apollo 15, 16 and 17", "Apollo 14, 15 and 16"], answer: 1, explanation: "Three battery-powered Lunar Roving Vehicles supported Apollo 15, Apollo 16 and Apollo 17." },
    { prompt: "According to the NASA NSSDCA record, which mission's rover travelled the farthest?", choices: ["Apollo 15 — 27.8 km", "Apollo 16 — 26.7 km", "Apollo 17 — 35.9 km"], answer: 2, explanation: "Apollo 17 recorded 35.9 km, the greatest of the three mission totals shown in the NASA record." },
    { prompt: "What is the combined distance in the three NASA NSSDCA records shown in this project?", choices: ["60.4 km", "90.4 km", "100.4 km"], answer: 1, explanation: "27.8 + 26.7 + 35.9 = 90.4 km. This is calculated from the historical mission totals, not live telemetry." },
  ],
  "alsep": [
    { prompt: "Why did astronauts deploy ALSEP instruments on the Moon?", choices: ["To keep collecting science after crews returned to Earth", "To provide television for astronauts", "To launch satellites into lunar orbit"], answer: 0, explanation: "ALSEP stations let NASA study the lunar environment for months and years, long after astronauts had left." },
    { prompt: "Which kinds of science did ALSEP support?", choices: ["Moonquakes, heat flow and magnetic fields", "Ocean tides and cloud formation", "Plant growth and animal migration"], answer: 0, explanation: "ALSEP instruments measured seismic activity, heat flow, magnetic fields and other properties of the Moon." },
    { prompt: "When did Mission Control end powered ALSEP operations?", choices: ["1969", "1972", "September 30, 1977"], answer: 2, explanation: "The experiment packages continued operating for years before NASA shut them down on September 30, 1977." },
  ],
  "sojourner": [
    { prompt: "What was Sojourner famous for?", choices: ["First wheeled vehicle to operate on another planet", "First spacecraft to orbit Jupiter", "First human-operated lunar car"], answer: 0, explanation: "Sojourner became the first wheeled vehicle to operate on another planet when it explored Mars in 1997." },
    { prompt: "How did Mars Pathfinder cushion its landing?", choices: ["A giant parachute alone", "Airbags that let it bounce across the surface", "A powered runway"], answer: 1, explanation: "Pathfinder used parachutes, retrorockets and airbags. It bounced across the Martian surface before coming to rest." },
    { prompt: "How long did Sojourner operate compared with its planned seven Martian days?", choices: ["Only one sol", "About seven sols", "83 sols"], answer: 2, explanation: "Sojourner was designed for seven Martian days but continued exploring for 83 sols." },
  ],
  "spirit-opportunity": [
    { prompt: "What were Spirit and Opportunity mainly sent to investigate?", choices: ["Evidence that liquid water once existed on Mars", "The rings of Saturn", "The temperature of Earth's oceans"], answer: 0, explanation: "The twin rovers studied Martian rocks and soils for geological evidence of ancient water." },
    { prompt: "What happened to Spirit?", choices: ["It was carried back to Earth", "It became stuck in soft soil and later fell silent", "It flew into orbit"], answer: 1, explanation: "Spirit became trapped in soft soil. Its final communication was received in March 2010." },
    { prompt: "What ended Opportunity's mission?", choices: ["A planet-wide dust storm blocked sunlight and communication", "It ran out of wheels on its first day", "It landed in a lake"], answer: 0, explanation: "A major dust storm blocked sunlight from Opportunity's solar panels. Its final communication came on June 10, 2018." },
  ],
  "insight": [
    { prompt: "Unlike a rover, what did NASA's InSight lander do?", choices: ["Stayed in one place to study Mars' interior", "Drove across the polar ice cap", "Collected samples from Earth's Moon"], answer: 0, explanation: "InSight was a stationary lander. It used instruments, including a seismometer, to investigate Mars' interior." },
    { prompt: "What did InSight's seismometer detect?", choices: ["Ocean waves", "Marsquakes and other seismic events", "Solar eclipses"], answer: 1, explanation: "InSight detected 1,319 marsquakes, helping scientists learn about the crust, mantle and core." },
    { prompt: "Why did InSight gradually lose power?", choices: ["Dust accumulated on its solar panels", "Its batteries were removed by astronauts", "Mars moved farther from the Sun"], answer: 0, explanation: "Dust built up on the solar panels, reducing the energy available to operate and communicate." },
  ],
  "mars-polar-lander": [
    { prompt: "What did Mars Polar Lander and Deep Space 2 include?", choices: ["One lander and two small probes", "Three orbiting telescopes", "Two helicopters and a rover"], answer: 0, explanation: "The mission included Mars Polar Lander and two experimental Deep Space 2 microprobes." },
    { prompt: "What was the lander meant to investigate near the Martian south pole?", choices: ["Water ice and the local soil", "The rings of Mars", "Volcanic activity on the Moon"], answer: 0, explanation: "Its robotic arm was intended to dig into the soil and investigate water ice and the Martian environment." },
    { prompt: "What is known about the spacecraft's final resting places?", choices: ["All were recovered", "Their exact locations remain unconfirmed", "They are orbiting Earth"], answer: 1, explanation: "NASA never received a successful signal. The lander and probes' exact final locations remain unknown." },
  ],
  "ingenuity": [
    { prompt: "What record did Ingenuity achieve?", choices: ["First powered, controlled flight on another planet", "First human flight on Mars", "First balloon flight around Jupiter"], answer: 0, explanation: "Ingenuity demonstrated powered, controlled flight in the thin Martian atmosphere." },
    { prompt: "How many flights did Ingenuity complete?", choices: ["5", "25", "72"], answer: 2, explanation: "It was planned as a five-flight technology demonstration but ultimately completed 72 flights." },
    { prompt: "Why did Ingenuity stop flying?", choices: ["Its rotor blades were damaged during its final flight", "It was deliberately launched into orbit", "It ran out of oxygen"], answer: 0, explanation: "Rotor damage during the 72nd flight in January 2024 left the helicopter unable to fly." },
  ],
};

const simpleSummaries: Record<string, string> = {
  "surveyor-3": "Surveyor 3 was a robot sent to the Moon before people landed there. It tested safe landing and studied lunar soil. Later, Apollo 12 astronauts visited it and brought some parts back to Earth.",
  "lunar-roving-vehicle": "Walking limited how far astronauts could explore. NASA built electric Moon buggies so crews could travel farther and carry more science equipment. The three Apollo rovers travelled 90.4 kilometres altogether, using the NASA NSSDCA mission totals.",
  "alsep": "Astronauts could only stay on the Moon for a short time. ALSEP was a set of science tools they left behind. The instruments kept studying moonquakes, heat and the lunar environment until NASA switched them off in 1977.",
  "sojourner": "Pathfinder landed on Mars in 1997 and carried a small rover called Sojourner. It rolled across the ground, studied rocks and showed that small robots could explore another planet.",
  "spirit-opportunity": "Spirit and Opportunity were robot geologists. They studied rocks and soil for clues that water once existed on Mars. They were planned for about 90 days but worked for years.",
  "insight": "InSight did not drive around Mars. It stayed in one place and listened for marsquakes. Those shakes helped scientists learn about the inside of the Red Planet.",
  "mars-polar-lander": "Mars Polar Lander was sent to study the soil near the Martian south pole. It carried two tiny probes, but none sent a successful signal after arrival. Their exact resting places are still unknown.",
  "ingenuity": "Ingenuity was a small helicopter that travelled to Mars with the Perseverance rover. It was planned for five test flights but flew 72 times. Damage to a rotor ended its flying career.",
};

export function MissionLearningLab({ artifact }: { artifact: Artifact }) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const questions = useMemo(() => questionBank[artifact.id] ?? [], [artifact.id]);
  const finished = completed;
  const question = questions[questionIndex];
  const selectedAnswer = answers[questionIndex];
  const score = answers.reduce((sum, answer, index) => sum + (answer === questions[index]?.answer ? 1 : 0), 0);
  const evidenceUrl = artifact.dataVisualization?.sourceUrl ?? artifact.sources[0]?.url;
  const evidenceLabel = artifact.dataVisualization?.sourceLabel ?? artifact.sources[0]?.label ?? "NASA mission references";

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const chooseAnswer = (choiceIndex: number) => {
    if (selectedAnswer !== undefined) return;
    setAnswers((current) => [...current, choiceIndex]);
  };

  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((current) => current + 1);
    } else {
      setCompleted(true);
    }
  };

  const restart = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setCompleted(false);
  };

  if (!questions.length) return null;

  return (
    <div className="mission-lab">
      <button
        className="mission-lab-launch"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="mission-lab-launch-icon" aria-hidden="true">✦</span>
        <span><strong>MISSION LAB</strong><small>Test what you discovered</small></span>
        <span className="mission-lab-launch-arrow" aria-hidden="true">↗</span>
      </button>

      {isOpen && (
        <div className="mission-lab-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}>
          <section className="mission-lab-dialog" role="dialog" aria-modal="true" aria-labelledby="mission-lab-title">
            <header className="mission-lab-header">
              <div>
                <p className="mission-lab-eyebrow">COSMIC FOOTPRINTS / LEARNING DECK</p>
                <h2 id="mission-lab-title">Mission Detective</h2>
                <p>Use the mission story and NASA evidence to solve each challenge.</p>
              </div>
              <button type="button" className="mission-lab-close" onClick={() => setIsOpen(false)} aria-label="Close Mission Lab">×</button>
            </header>

            <div className="mission-lab-progress" aria-label={finished ? "Quiz complete" : `Question ${questionIndex + 1} of ${questions.length}`}>
              {questions.map((_, index) => (
                <span key={index} className={index < answers.length ? "is-complete" : index === questionIndex ? "is-current" : ""} />
              ))}
            </div>

            <section className="mission-lab-simple">
              <span>THE STORY IN SIMPLE WORDS</span>
              <p>{simpleSummaries[artifact.id]}</p>
            </section>

            {artifact.dataVisualization && (
              <section className="mission-lab-data" aria-label="NASA mission data investigation">
                <div className="mission-lab-data-heading">
                  <div>
                    <span>NASA DATA / MISSION INVESTIGATION</span>
                    <h3>{artifact.dataVisualization.title}</h3>
                  </div>
                  <strong>{artifact.dataVisualization.records.reduce((sum, record) => sum + record.value, 0).toFixed(1)}<small> {artifact.dataVisualization.unit}</small></strong>
                </div>
                <p>{artifact.dataVisualization.description}</p>
                <div className="mission-lab-data-rows">
                  {artifact.dataVisualization.records.map((record) => {
                    const maximum = Math.max(...artifact.dataVisualization!.records.map((item) => item.value), 1);
                    return (
                      <div className="mission-lab-data-row" key={record.label}>
                        <div><span>{record.label}</span><strong>{record.value.toFixed(1)} {artifact.dataVisualization!.unit}</strong></div>
                        <span className="mission-lab-data-track"><i style={{ width: (record.value / maximum * 100) + "%" }} /></span>
                      </div>
                    );
                  })}
                </div>
                <a href={artifact.dataVisualization.sourceUrl} target="_blank" rel="noreferrer">OPEN ORIGINAL NASA DATA RECORD ↗</a>
                <small>Combined total is calculated from the three historical mission values shown above; this is not live telemetry.</small>
              </section>
            )}

            {finished ? (
              <div className="mission-lab-result">
                <span className="mission-lab-result-kicker">CASE FILE CLOSED</span>
                <strong>{score}<small> / {questions.length}</small></strong>
                <h3>{score === questions.length ? "Outstanding, Mission Expert." : score >= 2 ? "Excellent investigation." : "Every discovery starts with a question."}</h3>
                <p>You answered {score} of {questions.length} correctly. Revisit the evidence and try again to improve your score.</p>
                <button type="button" className="mission-lab-primary" onClick={restart}>TRY AGAIN</button>
              </div>
            ) : (
              <>
                <div className="mission-lab-question-meta">
                  <span>CASE {String(questionIndex + 1).padStart(2, "0")}</span>
                  <span>{artifact.name}</span>
                </div>
                <h3 className="mission-lab-question">{question.prompt}</h3>
                <div className="mission-lab-choices">
                  {question.choices.map((choice, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = question.answer === index;
                    const revealed = selectedAnswer !== undefined;
                    return (
                      <button
                        type="button"
                        key={choice}
                        className={"mission-lab-choice" + (revealed && isCorrect ? " is-correct" : "") + (isSelected && !isCorrect ? " is-incorrect" : "")}
                        onClick={() => chooseAnswer(index)}
                        disabled={revealed}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        <strong>{choice}</strong>
                        {revealed && isCorrect && <em>✓</em>}
                        {isSelected && !isCorrect && <em>×</em>}
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer !== undefined && (
                  <div className="mission-lab-feedback" role="status">
                    <strong>{selectedAnswer === question.answer ? "Correct deduction." : "Not quite. Here's the evidence."}</strong>
                    <p>{question.explanation}</p>
                    <button type="button" className="mission-lab-primary" onClick={nextQuestion}>
                      {questionIndex === questions.length - 1 ? "VIEW MY RESULT" : "NEXT CASE"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                )}
              </>
            )}

            <footer className="mission-lab-evidence">
              <span>FOLLOW THE EVIDENCE</span>
              <a href={evidenceUrl} target="_blank" rel="noreferrer">{evidenceLabel} ↗</a>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
