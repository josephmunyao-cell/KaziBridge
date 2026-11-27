import { createFileRoute } from "@tanstack/react-router";
import { KBProvider, useKB } from "@/lib/store";
import { Shell } from "@/components/kb/Shell";
import { TabBoundary } from "@/components/kb/common";
import { Overview } from "@/components/kb/Overview";
import { Sprints } from "@/components/kb/Sprints";
import { Creator } from "@/components/kb/Creator";
import { Proof } from "@/components/kb/Proof";
import { VerificationView } from "@/components/proof/VerificationView";
import { useProofRoute } from "@/lib/proof-route";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KaziBridge — Paid micro-sprints, verified proof" },
      { name: "description", content: "Short paid sprints, verified proof of work and real local opportunity for displaced and host-community youth in Kenya." },
      { property: "og:title", content: "KaziBridge — Paid micro-sprints, verified proof" },
      { property: "og:description", content: "Short paid sprints. Verified proof of work. Real local opportunity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      {t === "proof" && <Proof />}
    </TabBoundary>
  );
}

function Index() {
  const route = useProofRoute();
  return <KBProvider>{route ? <VerificationView route={route} /> : <Shell><Panel /></Shell>}</KBProvider>;
}
