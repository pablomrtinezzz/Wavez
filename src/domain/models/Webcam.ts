import { IslandId } from './Island';

/** How a camera is shown: played inside Wavez, or opened on its owner's site. */
export type WebcamSource =
  /** Player that the provider lets other sites embed (loaded on demand). */
  | { kind: 'embed'; provider: string; embedUrl: string; pageUrl: string }
  /** Provider that does not allow embedding: Wavez links to its page. */
  | { kind: 'link'; provider: string; pageUrl: string };

export interface Webcam {
  id: string;
  /** What the camera shows, e.g. 'Playa de Famara'. */
  name: string;
  island: IslandId;
  source: WebcamSource;
  /** Spots the camera points at. */
  spotsInView: string[];
  /** Spots next to the camera's beach: the camera shows the sea they get, not the peak itself. */
  spotsNearby: string[];
}

export type WebcamRelation = 'in-view' | 'nearby';

export function relationTo(webcam: Webcam, spotId: string): WebcamRelation | null {
  if (webcam.spotsInView.includes(spotId)) return 'in-view';
  if (webcam.spotsNearby.includes(spotId)) return 'nearby';
  return null;
}
