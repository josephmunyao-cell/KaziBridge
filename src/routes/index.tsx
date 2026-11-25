import { createFileRoute } from "@tanstack/react-router";
import { KBProvider, useKB } from "@/lib/store";
import { Shell } from "@/components/kb/Shell";
import { TabBoundary } from "@/components/kb/common";
import { Overview } from "@/components/kb/Overview";
import { Sprints } from "@/components/kb/Sprints";
import { Creator } from "@/components/kb/Creator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KaziBridge — Paid micro-sprints, verified proof" },
      { name: "description", content: "Short paid sprints, verified proof of work and real local opportunity for displaced and host-community youth in Kenya." },
      { property: "og:title", content: "KaziBridge — Paid micro-sprints, verified proof" },
      { property: "og:description", content: "Short paid sprints. Verified proof of work. Real local opportunity." },
    ],
  }),
  component: Index,
});

function Panel() {
  const { state } = useKB();
  const t = state.activeTab;
  return (
    <TabBoundary key={t} name={t}>
      {t === "overview" && <Overview />}
      {t === "sprints" && <Sprints />}
      {t === "creator" && <Creator />}
      {t === "proof" && <div className="kb-card p-8 text-center"><h2>Proof & Mentor</h2><p className="mt-2 text-muted-foreground">This section is not finished yet.</p></div>}
    </TabBoundary>
  );
}

function Index() {
  return <KBProvider><Shell><Panel /></Shell></KBProvider>;
}
