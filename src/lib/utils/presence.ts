import type { ActivityLog } from "@/types";

export function getPresenceKey(log: Pick<ActivityLog, "visitor_id" | "session_key" | "ip_address">) {
  return log.visitor_id || log.session_key || log.ip_address || null;
}
