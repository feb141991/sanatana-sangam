-- Rollback: Revert marketing_campaigns and marketing_campaign_variants check constraints

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_campaign_type_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_campaign_type_check
  check (campaign_type in ('newsletter', 'festival_reminder', 'announcement'));

alter table public.marketing_campaign_variants
  drop constraint if exists marketing_campaign_variants_channel_check;

alter table public.marketing_campaign_variants
  add constraint marketing_campaign_variants_channel_check
  check (channel in ('email', 'whatsapp'));
