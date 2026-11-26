import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const GameCanvas = lazy(() => import("@/components/game/GameCanvas"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Offshore Drilling Simulator — jogo 3D de perfuração offshore" },
      { name: "description", content: "Explore uma plataforma de perfuração offshore em 3D, entre na Doghouse e opere o Top Drive, bombas de lama, BOP e LOT." },
      { property: "og:title", content: "Offshore Drilling Simulator" },
      { property: "og:description", content: "Jogo 3D em terceira pessoa numa plataforma de perfuração offshore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="grid h-screen place-items-center bg-background font-hud text-sm tracking-[0.3em] text-primary">A CARREGAR PLATAFORMA…</div>}>
      <GameCanvas />
    </Suspense>
  );
}
