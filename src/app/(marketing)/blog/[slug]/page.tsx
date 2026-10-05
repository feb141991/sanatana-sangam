import { redirect } from "next/navigation";

type BlogSlugProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogSlugRedirect({ params }: BlogSlugProps) {
  const { slug } = await params;
  redirect(`/journal/${slug}`);
}
