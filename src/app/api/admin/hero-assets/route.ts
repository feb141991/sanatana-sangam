import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

const HERO_BUCKET = 'hero-assets';

function parseList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function POST(request: Request) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A hero image file is required' }, { status: 400 });
  }

  const label = String(formData.get('label') ?? '').trim();
  const heroAlt = String(formData.get('heroAlt') ?? '').trim();
  const objectPosition = String(formData.get('objectPosition') ?? 'center 24%').trim() || 'center 24%';

  if (!label || !heroAlt) {
    return NextResponse.json({ error: 'label and heroAlt are required' }, { status: 400 });
  }

  if (!['image/webp', 'image/jpeg', 'image/png'].includes(file.type)) {
    return NextResponse.json({ error: 'Use webp, jpg, or png hero artwork' }, { status: 400 });
  }

  await admin.supabase.storage.createBucket(HERO_BUCKET, { public: true }).catch(() => null);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const path = `${slugifyFileName(label) || 'hero'}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.supabase.storage
    .from(HERO_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = admin.supabase.storage.from(HERO_BUCKET).getPublicUrl(path);
  const heroImage = publicUrl.publicUrl;

  const metadata = {
    label,
    hero_image: heroImage,
    hero_alt: heroAlt,
    object_position: objectPosition,
    traditions: parseList(formData.get('traditions')),
    sampradayas: parseList(formData.get('sampradayas')),
    ishta_devatas: parseList(formData.get('ishtaDevatas')),
    festival_slugs: parseList(formData.get('festivalSlugs')),
    tags: parseList(formData.get('tags')),
    priority: Number(formData.get('priority') ?? 0) || 0,
    is_active: formData.get('isActive') !== 'false',
    uploaded_by: admin.username,
  };

  const { data, error: metadataError } = await admin.supabase
    .from('hero_assets')
    .insert(metadata)
    .select('*')
    .single();

  return NextResponse.json({
    asset: data ?? { ...metadata, id: null },
    metadataStored: !metadataError,
    metadataError: metadataError?.message ?? null,
  });
}
