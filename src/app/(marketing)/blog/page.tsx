import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "The Sanctuary Blog & Journal | Shoonaya",
  description: "Contemplative essays and reflections on lived dharma.",
  alternates: {
    canonical: "https://www.shoonaya.com/journal",
  },
};

export default function BlogRedirectPage() {
  redirect("/journal");
}
