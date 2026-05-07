import { bg, type Messages } from "./messages-bg";
import { en } from "./messages-en";

export type Lang = "bg" | "en";

export const COPY: Record<Lang, Messages> = { bg, en };

export type { Messages };
