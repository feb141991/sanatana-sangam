import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  invalidateNotificationTemplateCache,
  type NotificationTemplateItem,
} from '@/lib/notification-templates';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createServiceRoleSupabaseClient();
  let dbRows: any[] = [];
  try {
    const { data, error } = await supabase
      .from('notification_templates' as any)
      .select('*');
    if (!error && Array.isArray(data)) {
      dbRows = data;
    }
  } catch {
    // If DB is unreachable, proceed with baseline defaults
  }

  const dbMap = new Map(dbRows.map((r) => [r.id, r]));

  const merged: NotificationTemplateItem[] = DEFAULT_NOTIFICATION_TEMPLATES.map((tpl) => {
    const override = dbMap.get(tpl.id);
    if (override) {
      return {
        ...tpl,
        titleTemplate: override.title_template || tpl.defaultTitle,
        bodyTemplate: override.body_template || tpl.defaultBody,
        isActive: override.is_active !== undefined ? override.is_active : tpl.isActive,
        updatedAt: override.updated_at,
        updatedBy: override.updated_by,
      };
    }
    return tpl;
  });

  return NextResponse.json({ templates: merged });
}

export async function PATCH(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const { id, titleTemplate, bodyTemplate, isActive, resetToDefault } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Valid template id is required' }, { status: 400 });
  }

  const defaultTpl = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.id === id);
  if (!defaultTpl) {
    return NextResponse.json({ error: 'Unknown notification template ID' }, { status: 404 });
  }

  const finalTitle = resetToDefault ? defaultTpl.defaultTitle : (titleTemplate ?? defaultTpl.titleTemplate);
  const finalBody = resetToDefault ? defaultTpl.defaultBody : (bodyTemplate ?? defaultTpl.bodyTemplate);
  const finalActive = resetToDefault ? true : (isActive !== undefined ? Boolean(isActive) : true);

  if (finalTitle.length > 120) {
    return NextResponse.json({ error: 'Title must be 120 characters or fewer' }, { status: 400 });
  }
  if (finalBody.length > 300) {
    return NextResponse.json({ error: 'Body must be 300 characters or fewer' }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  try {
    const { error: upsertErr } = await supabase
      .from('notification_templates' as any)
      .upsert(
        {
          id,
          routine: defaultTpl.routine,
          tradition: defaultTpl.tradition,
          category: defaultTpl.category,
          title_template: finalTitle,
          body_template: finalBody,
          available_placeholders: defaultTpl.placeholders,
          is_active: finalActive,
          updated_at: now,
        },
        { onConflict: 'id' }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Database write error' }, { status: 500 });
  }

  invalidateNotificationTemplateCache();

  return NextResponse.json({
    success: true,
    template: {
      ...defaultTpl,
      titleTemplate: finalTitle,
      bodyTemplate: finalBody,
      isActive: finalActive,
      updatedAt: now,
    },
  });
}
