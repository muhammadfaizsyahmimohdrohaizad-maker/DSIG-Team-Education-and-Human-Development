import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CareerPrep",
    short_name: "CareerPrep",
    description: "See how your diploma modules connect to real jobs, then practise for them.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#1F5A99",
  };
}
