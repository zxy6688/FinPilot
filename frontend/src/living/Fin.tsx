import { FinArt } from "../redesign/Fin";
import type { FinMood } from "./types";
export default function Fin({
  mood = "calm",
  size = 64,
}: {
  mood?: FinMood;
  size?: number;
  domains?: number[];
  seed?: boolean;
}) {
  return <FinArt mood={mood} size={size} />;
}
