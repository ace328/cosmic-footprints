import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import type {
  Destination,
  SceneMode,
} from "./components/experience/SpaceScene";

import { ArtifactExplorer } from "./components/artifacts/ArtifactExplorer";
import { ArtifactStory } from "./components/artifacts/ArtifactStory";
import { MissionLearningLab } from "./components/learning/MissionLearningLab";
import { GuidedExplorer } from "./components/learning/GuidedExplorer";
import { MissionControl } from "./components/mission/MissionControl";
import { LunarMissionControl } from "./components/mission/LunarMissionControl";

import {
  getArtifactById,
  getArtifactsByDestination,
  filterArtifacts,
} from "./data/artifacts";

import type { Artifact } from "./data/artifacts";

import { useReducedMotion } from "./hooks/useReducedMotion";

import "./App.css";

gsap.registerPlugin(useGSAP);

function SceneLoadingFallback({ label }: { label: string }) {
  return (
    <div className="scene-loading-fallback" role="status" aria-live="polite">
      <span className="scene-loading-orbit" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

const SpaceScene = lazy(async () => {
  const module = await import("./components/experience/SpaceScene");
  return { default: module.SpaceScene };
});

const ArchivePlanetScene = lazy(async () => {
  const module = await import("./components/experience/ArchivePlanetScene");
  return { default: module.ArchivePlanetScene };
});

function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [mode, setMode] = useState<SceneMode>("intro");

  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const [selectedArtifact, setSelectedArtifact] =
    useState<Artifact | null>(null);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [archiveCategory, setArchiveCategory] = useState("ALL");
  const [guidedJourneyOpen, setGuidedJourneyOpen] = useState(false);
  const [missionControlOpen, setMissionControlOpen] = useState(false);

  const destinationArtifacts = useMemo(
    () => (
      selectedDestination
        ? getArtifactsByDestination(selectedDestination)
        : []
    ),
    [selectedDestination],
  );

  const visibleArtifactIds = useMemo(
    () => filterArtifacts(destinationArtifacts, archiveSearchQuery, archiveCategory).map((artifact) => artifact.id),
    [destinationArtifacts, archiveSearchQuery, archiveCategory],
  );

  const guidedArtifacts = useMemo(
    () => ["surveyor-3", "spirit-opportunity", "ingenuity"]
      .map((id) => getArtifactById(id))
      .filter((artifact): artifact is Artifact => Boolean(artifact)),
    [],
  );

  const handleDestinationSelect = useCallback(
    (destination: Destination) => {
      if (mode !== "destinations") return;

      setSelectedDestination(destination);
      setSelectedArtifact(null);
      setArchiveSearchQuery("");
      setArchiveCategory("ALL");
      setMissionControlOpen(false);
      setMode("traveling");
    },
    [mode],
  );

  const handleArrival = useCallback(() => {
    setMode("archive");
  }, []);

  const handleArtifactSelect = useCallback(
    (artifactId: string) => {
      if (!selectedDestination) return;

      const artifact = getArtifactById(artifactId);

      if (artifact && artifact.destination === selectedDestination) {
        setSelectedArtifact(artifact);
      }
    },
    [selectedDestination],
  );

  useEffect(() => {
    if (!selectedArtifact) return;

    const handleStoryEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedArtifact(null);
      }
    };

    window.addEventListener("keydown", handleStoryEscape);
    return () => window.removeEventListener("keydown", handleStoryEscape);
  }, [selectedArtifact]);

  const beginExploration = () => {
    setMode("destinations");
  };

  const returnToDestinations = () => {
    setSelectedArtifact(null);
    setArchiveSearchQuery("");
    setArchiveCategory("ALL");
    setSelectedDestination(null);
    setMissionControlOpen(false);
    setMode("destinations");
  };

  const returnToEarth = () => {
    setSelectedArtifact(null);
    setSelectedDestination(null);
    setMissionControlOpen(false);
    setMode("intro");
  };

  useGSAP(
    () => {
      if (reducedMotion) return;

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      if (mode === "intro") {
        timeline
          .fromTo(
            ".site-header",
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.9 },
          )
          .fromTo(
            ".intro-kicker",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.75 },
            "-=0.4",
          )
          .fromTo(
            ".intro-title-line",
            { opacity: 0, y: 55, rotateX: -15 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 1.1,
              stagger: 0.14,
            },
            "-=0.4",
          )
          .fromTo(
            ".intro-description",
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.6",
          )
          .fromTo(
            ".hero-actions",
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.5",
          )
          .fromTo(
            ".hero-meta",
            { opacity: 0 },
            { opacity: 1, duration: 0.8 },
          );
      }

      if (mode === "destinations") {
        timeline
          .fromTo(
            ".destination-heading",
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.85 },
          )
          .fromTo(
            ".destination-controls",
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 },
            "-=0.35",
          )
          .fromTo(
            ".destination-hint",
            { opacity: 0 },
            { opacity: 1, duration: 0.7 },
            "-=0.3",
          );
      }

      if (mode === "traveling") {
        timeline.fromTo(
          ".travel-overlay",
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.7 },
        );
      }

      if (mode === "archive") {
        if (selectedArtifact) {
          timeline.fromTo(
            ".story-panel",
            { opacity: 0, x: -26 },
            { opacity: 1, x: 0, duration: 0.8 },
          );
        } else {
          timeline
            .fromTo(
              ".archive-explorer-panel",
              { opacity: 0, x: -30 },
              { opacity: 1, x: 0, duration: 0.85 },
            )
            .fromTo(
              ".archive-list-item",
              { opacity: 0, y: 14 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.09,
              },
              "-=0.35",
            );
        }
      }

      return () => timeline.kill();
    },
    {
      scope: rootRef,
      dependencies: [mode, reducedMotion, selectedArtifact],
      revertOnUpdate: true,
    },
  );

  const destinationName =
    selectedDestination === "moon" ? "THE MOON" : "MARS";

  return (
    <div
      ref={rootRef}
      className={"experience-shell experience-" + mode}
    >
      <Suspense fallback={<SceneLoadingFallback label="PREPARING PLANETARY VIEW" />}>
        <SpaceScene
          mode={mode}
          selectedDestination={selectedDestination}
          reducedMotion={reducedMotion}
          onDestinationSelect={handleDestinationSelect}
          onArrival={handleArrival}
        />
      </Suspense>

      {mode === "archive" && selectedDestination && (
        <Suspense fallback={<SceneLoadingFallback label="LOADING SURFACE ARCHIVE" />}>
          <ArchivePlanetScene
            destination={selectedDestination}
            artifacts={destinationArtifacts}
            selectedArtifactId={selectedArtifact?.id ?? null}
            visibleArtifactIds={visibleArtifactIds}
            reducedMotion={reducedMotion}
            onSelectArtifact={handleArtifactSelect}
          />
        </Suspense>
      )}

      <div className="space-vignette" aria-hidden="true" />

      <header className="site-header">
        <a
          href="/"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            returnToEarth();
          }}
        >
          <span className="brand-symbol">✦</span>
          <span>COSMIC FOOTPRINTS</span>
        </a>

        <p className="header-caption">
          AN INTERACTIVE SPACE HERITAGE ATLAS
        </p>

        {mode !== "intro" && (
          <button
            type="button"
            className="earth-return"
            onClick={returnToEarth}
            disabled={mode === "traveling"}
          >
            RETURN TO EARTH
          </button>
        )}
      </header>

      <main className="experience-main">
        {mode === "intro" && (
          <section className="hero-copy">
            <p className="intro-kicker">
              <span className="kicker-line" />
              A JOURNEY THROUGH HUMANITY'S SPACE LEGACY
            </p>

            <h1 className="intro-title">
              <span className="intro-title-line">COSMIC</span>
              <span className="intro-title-line title-outline">
                FOOTPRINTS
              </span>
            </h1>

            <p className="intro-description">
              The machines may be silent. Their discoveries aren't.
              <span>
                Journey across the Solar System and discover the
                explorers humanity left behind.
              </span>
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="launch-button"
                onClick={beginExploration}
              >
                BEGIN EXPLORATION
                <span aria-hidden="true">↗</span>
              </button>

              <span className="action-caption">
                DRAG THE EARTH TO ROTATE
              </span>
            </div>
          </section>
        )}

        {mode === "destinations" && (
          <section className="destination-interface">
            <div className="destination-heading">
              <p className="intro-kicker">
                <span className="kicker-line" />
                MISSION CONTROL / DEPARTURE POINT: EARTH
              </p>

              <h1>
                CHOOSE YOUR <span>DESTINATION.</span>
              </h1>

              <p className="destination-hint">
                SELECT A PLANET TO BEGIN YOUR JOURNEY
              </p>
            </div>

            <div className="destination-controls">
              <button
                type="button"
                className="destination-control moon-control"
                onClick={() => handleDestinationSelect("moon")}
              >
                <span className="control-number">01</span>
                <span className="control-details">
                  <strong>THE MOON</strong>
                  <small>LUNAR EXPLORATION</small>
                </span>
                <span className="control-status">AVAILABLE ↗</span>
              </button>

              <button
                type="button"
                className="destination-control mars-control"
                onClick={() => handleDestinationSelect("mars")}
              >
                <span className="control-number">02</span>
                <span className="control-details">
                  <strong>MARS</strong>
                  <small>THE RED PLANET</small>
                </span>
                <span className="control-status">AVAILABLE ↗</span>
              </button>

              <button
                type="button"
                className="destination-control beyond-control"
                disabled
                aria-label="Beyond: locked, coming soon"
              >
                <span className="control-number">03</span>
                <span className="control-details">
                  <strong>BEYOND</strong>
                  <small>DEEP SPACE EXPLORATION</small>
                </span>
                <span className="control-status">▣ LOCKED</span>
              </button>
            </div>

            <p className="destination-footnote">
              DRAG TO ROTATE  /  CLICK A PLANET OR SELECT A DESTINATION
            </p>
          </section>
        )}

        {mode === "traveling" && (
          <section className="travel-overlay" aria-live="polite">
            <span className="travel-indicator">
              <span />
              COURSE INITIATED
            </span>

            <h1>
              TRAVELLING TO
              <span>{destinationName}</span>
            </h1>

            <p>
              Preparing for arrival. The journey beyond Earth begins here.
            </p>
          </section>
        )}

        {mode === "archive" && selectedDestination && (
          selectedArtifact ? (
            <>
              <ArtifactStory
                artifact={selectedArtifact}
                onBack={() => setSelectedArtifact(null)}
              />
              <MissionLearningLab key={selectedArtifact.id} artifact={selectedArtifact} />
            </>
          ) : missionControlOpen ? (
            selectedDestination === "mars"
              ? <MissionControl onBack={() => setMissionControlOpen(false)} />
              : <LunarMissionControl onBack={() => setMissionControlOpen(false)} />
          ) : (
            <ArtifactExplorer
              destination={selectedDestination}
              onSelect={setSelectedArtifact}
              onChangeDestination={returnToDestinations}
              searchQuery={archiveSearchQuery}
              activeCategory={archiveCategory}
              onSearchQueryChange={setArchiveSearchQuery}
              onActiveCategoryChange={setArchiveCategory}
              visibleArtifactIds={visibleArtifactIds}
              onStartGuidedJourney={() => setGuidedJourneyOpen(true)}
              onOpenMissionControl={() => setMissionControlOpen(true)}
            />
          )
        )}
      </main>

      {mode === "archive" && guidedJourneyOpen && (
        <GuidedExplorer
          artifacts={guidedArtifacts}
          onExit={() => setGuidedJourneyOpen(false)}
        />
      )}

      {mode === "intro" && (
        <footer className="hero-meta">
          <span>ORIGIN POINT / EARTH</span>
          <span>HUMANITY'S OFFWORLD LEGACY / 001</span>
        </footer>
      )}
    </div>
  );
}

export default App;
