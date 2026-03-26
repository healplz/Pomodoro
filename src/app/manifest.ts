import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pomodoro",
    short_name: "Pomo",
    description: "Focused work sessions with streaks",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#C30232",
    theme_color: "#C30232",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
