import type { Destination } from "./artifacts";

export interface PlanetMarker {
  artifactId: string;
  code: string;
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Marker coordinates are visual placements for this educational globe.
 * They are deliberately not presented as surveyed landing coordinates.
 * See the archive interface note: placements are illustrative, not exact.
 */
export const planetMarkers: Record<Destination, PlanetMarker[]> = {
  moon: [
    {
      artifactId: "surveyor-3",
      code: "S3",
      label: "Surveyor 3",
      latitude: -5,
      longitude: -31,
    },
    {
      artifactId: "lunar-roving-vehicle",
      code: "R15",
      label: "Apollo 15 LRV",
      latitude: 25,
      longitude: -8,
    },
    {
      artifactId: "lunar-roving-vehicle",
      code: "R16",
      label: "Apollo 16 LRV",
      latitude: -16,
      longitude: 17,
    },
    {
      artifactId: "lunar-roving-vehicle",
      code: "R17",
      label: "Apollo 17 LRV",
      latitude: 18,
      longitude: 45,
    },
    {
      artifactId: "alsep",
      code: "E12",
      label: "Apollo 12 ALSEP",
      latitude: -13,
      longitude: -18,
    },
    {
      artifactId: "alsep",
      code: "E14",
      label: "Apollo 14 ALSEP",
      latitude: -27,
      longitude: 1,
    },
    {
      artifactId: "alsep",
      code: "E15",
      label: "Apollo 15 ALSEP",
      latitude: 32,
      longitude: 7,
    },
    {
      artifactId: "alsep",
      code: "E16",
      label: "Apollo 16 ALSEP",
      latitude: -31,
      longitude: 28,
    },
    {
      artifactId: "alsep",
      code: "E17",
      label: "Apollo 17 ALSEP",
      latitude: 8,
      longitude: 58,
    },
  ],
  mars: [
    {
      artifactId: "sojourner",
      code: "SOJ",
      label: "Sojourner",
      latitude: 19,
      longitude: -34,
    },
    {
      artifactId: "spirit-opportunity",
      code: "SP",
      label: "Spirit",
      latitude: -16,
      longitude: -23,
    },
    {
      artifactId: "spirit-opportunity",
      code: "OP",
      label: "Opportunity",
      latitude: -5,
      longitude: 13,
    },
    {
      artifactId: "insight",
      code: "INS",
      label: "InSight",
      latitude: 5,
      longitude: 43,
    },
    {
      artifactId: "ingenuity",
      code: "ING",
      label: "Ingenuity",
      latitude: 28,
      longitude: 12,
    },
  ],
};

export function getPlanetMarkers(destination: Destination) {
  return planetMarkers[destination];
}
