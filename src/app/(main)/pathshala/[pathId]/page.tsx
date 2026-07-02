import { redirect } from 'next/navigation';


interface Props {
  params: Promise<{ pathId: string }>;
}

export default async function PathshalaPathPage({ params }: Props) {
  const { pathId } = await params;
  redirect(`/pathshala/${pathId}/lesson`);
}
