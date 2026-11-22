import type { Artifact } from "./artifacts";

export type MissionFateStatus =
  | "silent-surface"
  | "power-depleted"
  | "intentionally-terminated"
  | "lost-on-arrival"
  | "hardware-returned"
  | "location-unconfirmed"
  | "left-on-surface";

export interface MissionFateRecord {
  status: MissionFateStatus;
  statusLabel: string;
  lastKnownSignalLabel: string;
  lastKnownSignal: string;
  officialEndLabel: string;
  officialEnd: string;
  reason: string;
  restingPlace: string;
  locationConfidence: "known" | "unknown" | "partial";
  sourceLabel: string;
  sourceUrl: string;
}

export const missionFates: Record<string, MissionFateRecord> = {
  "surveyor-3": {
    status: "hardware-returned",
    statusLabel: "SILENT ON THE MOON / PARTS RETURNED",
    lastKnownSignalLabel: "Last contact",
    lastKnownSignal: "May 4, 1967 — NASA's last contact with Surveyor 3 was two days after lunar night began.",
    officialEndLabel: "Mission operations ended",
    officialEnd: "May 4, 1967 — no later spacecraft contact was received. Apollo 12 visited the inactive lander in November 1969 and returned selected components to Earth.",
    reason: "The lander stopped communicating after the lunar night began. NASA does not describe this as a deliberately commanded shutdown.",
    restingPlace: "The remaining lander is in southeastern Oceanus Procellarum. Its camera and other selected components were brought back to Earth by Apollo 12.",
    locationConfidence: "partial",
    sourceLabel: "NASA — Surveyor 3 mission record",
    sourceUrl: "https://science.nasa.gov/mission/surveyor-3/",
  },
  "lunar-roving-vehicle": {
    status: "left-on-surface",
    statusLabel: "LEFT ON THE LUNAR SURFACE",
    lastKnownSignalLabel: "Last operational use",
    lastKnownSignal: "The final Apollo 17 lunar surface excursion ended on December 14, 1972. The LRV was a crew-operated vehicle, not an independently communicating spacecraft.",
    officialEndLabel: "Program's final lunar use",
    officialEnd: "December 14, 1972 — the Apollo 17 crew completed its final lunar EVA and left the rover at the landing site.",
    reason: "The rovers were intentionally left behind when the astronauts departed the Moon; they were not abandoned after a vehicle failure.",
    restingPlace: "Three Lunar Roving Vehicles remain at the Apollo 15, 16 and 17 landing sites.",
    locationConfidence: "known",
    sourceLabel: "NASA — Apollo 17 mission details",
    sourceUrl: "https://www.nasa.gov/missions/apollo/apollo-17-mission-details/",
  },
  "alsep": {
    status: "intentionally-terminated",
    statusLabel: "SCIENCE OPERATIONS INTENTIONALLY ENDED",
    lastKnownSignalLabel: "Final science operations",
    lastKnownSignal: "September 30, 1977 — NASA ended ALSEP support operations and discontinued processing of the experiment data stream.",
    officialEndLabel: "Official shutdown",
    officialEnd: "September 30, 1977 — all five ALSEP stations were officially shut down.",
    reason: "The program ended when funding for technical and scientific support ran out. This was an intentional program termination, not a simultaneous hardware failure.",
    restingPlace: "The experiment packages remain at the Apollo 12, 14, 15, 16 and 17 landing sites.",
    locationConfidence: "known",
    sourceLabel: "NASA — ALSEP termination report",
    sourceUrl: "https://ntrs.nasa.gov/api/citations/19790014808/downloads/19790014808.pdf",
  },
  "sojourner": {
    status: "power-depleted",
    statusLabel: "SILENT ON MARS",
    lastKnownSignalLabel: "Last successful data transmission",
    lastKnownSignal: "September 27, 1997 — the final successful Pathfinder data transmission was received at 10:23 UTC. A later signal without spacecraft data was received October 7.",
    officialEndLabel: "Mission officially concluded",
    officialEnd: "March 10, 1998 — after months of unsuccessful attempts to restore communication.",
    reason: "The lander stopped returning data. Engineers suspected battery depletion and falling internal temperatures; the precise cause was not confirmed.",
    restingPlace: "The Pathfinder lander and Sojourner rover remain together at the Ares Vallis landing site, known as Carl Sagan Memorial Station.",
    locationConfidence: "known",
    sourceLabel: "NASA — Pathfinder on Mars",
    sourceUrl: "https://science.nasa.gov/resource/pathfinder-on-mars-2/",
  },
  "spirit-opportunity": {
    status: "silent-surface",
    statusLabel: "TWO ROVERS / TWO DIFFERENT ENDINGS",
    lastKnownSignalLabel: "Last communication",
    lastKnownSignal: "Spirit: March 22, 2010. Opportunity: June 10, 2018, during a planet-wide dust storm.",
    officialEndLabel: "Recovery / mission end",
    officialEnd: "Spirit: recovery efforts ended May 25, 2011. Opportunity: NASA declared end of mission February 13, 2019.",
    reason: "Spirit became stuck in soft soil and likely succumbed to extreme cold during its fourth Martian winter. Opportunity lost power during a planet-wide dust storm that reduced sunlight reaching its solar panels.",
    restingPlace: "Spirit remains in Gusev Crater. Opportunity remains in Perseverance Valley within Endeavour Crater.",
    locationConfidence: "known",
    sourceLabel: "NASA — Spirit and Opportunity mission records",
    sourceUrl: "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/",
  },
  "insight": {
    status: "power-depleted",
    statusLabel: "POWER DEPLETED / MISSION RETIRED",
    lastKnownSignalLabel: "Last communication",
    lastKnownSignal: "December 15, 2022 — NASA's last communication with InSight. It did not respond to later attempts.",
    officialEndLabel: "Mission retired",
    officialEnd: "December 21, 2022 — NASA declared the mission ended after two consecutive communication attempts failed.",
    reason: "Dust accumulated on the solar panels and reduced power generation until the solar-powered batteries could no longer sustain operations.",
    restingPlace: "InSight remains at Elysium Planitia on Mars.",
    locationConfidence: "known",
    sourceLabel: "NASA — InSight mission retirement",
    sourceUrl: "https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/",
  },
  "mars-polar-lander": {
    status: "location-unconfirmed",
    statusLabel: "LOST ON ARRIVAL / LOCATION UNCONFIRMED",
    lastKnownSignalLabel: "Communication record",
    lastKnownSignal: "No successful signal was received from the lander or either Deep Space 2 probe during the planned Mars arrival on December 3, 1999.",
    officialEndLabel: "Recovery attempts ended",
    officialEnd: "January 17, 2000 — NASA terminated attempts to regain communication with the lost lander. This is not a confirmed last-transmission date.",
    reason: "An investigation found that a likely false touchdown signal may have shut down the main engines too early, causing the lander to crash. The exact sequence was not directly observed.",
    restingPlace: "Unknown. NASA never confirmed the final resting places of Mars Polar Lander or the two Deep Space 2 probes.",
    locationConfidence: "unknown",
    sourceLabel: "NASA — Mars Polar Lander / Deep Space 2",
    sourceUrl: "https://science.nasa.gov/mission/mars-polar-lander-deep-space-2/",
  },
  "ingenuity": {
    status: "silent-surface",
    statusLabel: "GROUNDED / FLIGHT MISSION ENDED",
    lastKnownSignalLabel: "Last flight",
    lastKnownSignal: "January 18, 2024 — Ingenuity completed flight 72. Images received afterward showed rotor-blade damage.",
    officialEndLabel: "Mission end announced",
    officialEnd: "January 25, 2024 — NASA announced the end of the helicopter's mission. Ingenuity was still upright and in communication with ground controllers at the time of the announcement.",
    reason: "One or more rotor blades were damaged during landing on flight 72, leaving the helicopter unable to fly. NASA did not describe it as having lost all communication on that date.",
    restingPlace: "Ingenuity remains upright at its final airfield in Neretva Vallis, Jezero Crater, Mars.",
    locationConfidence: "known",
    sourceLabel: "NASA — Ingenuity mission ends",
    sourceUrl: "https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/",
  },
};

export interface MissionEnduranceRecord {
  label: string;
  planned: number;
  achieved: number;
  unit: "sols" | "flights";
  explanation: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const missionEndurance: Record<string, MissionEnduranceRecord> = {
  sojourner: {
    label: "Sojourner rover",
    planned: 7,
    achieved: 83,
    unit: "sols",
    explanation: "Sojourner was designed for a seven-sol primary mission but continued exploring for 83 sols.",
    sourceLabel: "NASA — Pathfinder on Mars",
    sourceUrl: "https://science.nasa.gov/resource/pathfinder-on-mars-2/",
  },
  ingenuity: {
    label: "Ingenuity helicopter",
    planned: 5,
    achieved: 72,
    unit: "flights",
    explanation: "The technology demonstration was designed for up to five test flights; Ingenuity ultimately completed 72.",
    sourceLabel: "NASA — Ingenuity mission ends",
    sourceUrl: "https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/",
  },
};

export function getMissionFate(artifact: Artifact) {
  return missionFates[artifact.id];
}

export function getMissionEndurance(artifact: Artifact) {
  return missionEndurance[artifact.id];
}
