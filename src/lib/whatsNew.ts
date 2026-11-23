import type { User } from "@/types";

export type ReleaseHighlightIcon =
  | "typing"
  | "profile"
  | "banking"
  | "chat"
  | "mail"
  | "link"
  | "check";

export type ReleaseHighlight = {
  title: string;
  description: string;
  icon?: ReleaseHighlightIcon;
};

export type Release = {
  /** Stable id stored on the user once dismissed; never change it after shipping */
  id: string;
  /** Local date (YYYY-MM-DD) the release was announced */
  date: string;
  title: string;
  summary: string;
  highlights: ReleaseHighlight[];
  action?: { label: string; to: string };
};

/** Newest first. Add a new entry at the top to show it to everyone once. */
export const RELEASES: Release[] = [
  {
    id: "2026-11-live-support-banking-controls",
    date: "2026-11-23",
    title: "Better support chat & banking controls",
    summary:
      "Personalize how customers see you in support chat and set custom account details directly in Online Banking.",
    highlights: [
      {
        icon: "typing",
        title: "Live typing indicators",
        description:
          "See when customers are typing in real time, and show when you're replying across ParcelFinda, MyFlightLookup, and Lindenway Banking.",
      },
      {
        icon: "profile",
        title: "Support photo & display name",
        description:
          "Upload a profile picture and custom name in Support Settings so customers see your profile in chat headers and replies.",
      },
      {
        icon: "banking",
        title: "Custom account & routing numbers",
        description:
          "Set or auto-generate checking account and routing numbers in the Online Banking editor and manual transfer entries.",
      },
    ],
    action: { label: "Open support", to: "/support" },
  },
  {
    id: "2026-10-support-inbox",
    date: "2026-10-24",
    title: "Support messages, in one inbox",
    summary:
      "People who look up your tracking IDs on ParcelFinda or MyFlightLookup can now message you, and you can answer them from SharpToolz.",
    highlights: [
      {
        icon: "chat",
        title: "Live chat",
        description: "Messages arrive the moment they're sent, with a sound alert, and your replies show up instantly for the customer.",
      },
      {
        icon: "mail",
        title: "Email support",
        description: "Requests from the contact form land here too, and your replies are sent to the customer by email.",
      },
      {
        icon: "link",
        title: "Linked to your documents",
        description: "Each conversation is matched to the document by its tracking ID, so you always know which one it's about.",
      },
    ],
    action: { label: "Open support inbox", to: "/support" },
  },
];

function joinedBefore(user: Pick<User, "date_joined">, release: Release) {
  // Users who signed up after a release already got it as part of the product
  const joined = user.date_joined ? new Date(user.date_joined) : null;
  if (!joined || isNaN(joined.getTime())) return true;
  const [year, month, day] = release.date.split("-").map(Number);
  return joined < new Date(year, month - 1, day + 1);
}

/** Releases the user hasn't dismissed yet, newest first. */
export function unseenReleases(
  user: Pick<User, "date_joined" | "last_seen_update">,
  releases: Release[] = RELEASES,
): Release[] {
  const seenIndex = user.last_seen_update
    ? releases.findIndex((release) => release.id === user.last_seen_update)
    : -1;
  const newer = seenIndex === -1 ? releases : releases.slice(0, seenIndex);
  return newer.filter((release) => joinedBefore(user, release));
}
