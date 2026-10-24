import { describe, expect, it } from "vitest";
import { unseenReleases, type Release } from "./whatsNew";

const release = (id: string, date: string): Release => ({ id, date, title: id, summary: "", highlights: [] });
const RELEASES = [release("c", "2026-12-01"), release("b", "2026-11-01"), release("a", "2026-10-01")];
const oldUser = { date_joined: "2026-01-01T10:00:00Z" };

describe("unseenReleases", () => {
  it("shows every release to an existing user who has seen none", () => {
    expect(unseenReleases({ ...oldUser, last_seen_update: "" }, RELEASES).map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("shows only releases newer than the one last dismissed", () => {
    expect(unseenReleases({ ...oldUser, last_seen_update: "b" }, RELEASES).map((r) => r.id)).toEqual(["c"]);
    expect(unseenReleases({ ...oldUser, last_seen_update: "c" }, RELEASES)).toEqual([]);
  });

  it("skips releases from before the user signed up", () => {
    const user = { date_joined: "2026-11-15T09:00:00Z", last_seen_update: "" };
    expect(unseenReleases(user, RELEASES).map((r) => r.id)).toEqual(["c"]);
  });

  it("still shows a release to someone who joined on its day", () => {
    const user = { date_joined: "2026-12-01T18:00:00", last_seen_update: "" };
    expect(unseenReleases(user, RELEASES).map((r) => r.id)).toEqual(["c"]);
  });

  it("treats an unknown seen id as nothing seen", () => {
    expect(unseenReleases({ ...oldUser, last_seen_update: "gone" }, RELEASES)).toHaveLength(3);
  });
});
