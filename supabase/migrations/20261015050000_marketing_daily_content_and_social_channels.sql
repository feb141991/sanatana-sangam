-- Migration: Add daily_content to marketing_campaigns.campaign_type and add instagram, twitter, linkedin to marketing_campaign_variants.channel
-- Context: Supports Daily Content / Daily Wisdom campaigns and multi-channel publishing to Instagram, Twitter/X, and LinkedIn.

-- 1. Relax campaign_type check constraint on public.marketing_campaigns
alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_campaign_type_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_campaign_type_check
  check (campaign_type in ('newsletter', 'festival_reminder', 'announcement', 'daily_content'));

-- 2. Relax channel check constraint on public.marketing_campaign_variants
alter table public.marketing_campaign_variants
  drop constraint if exists marketing_campaign_variants_channel_check;

alter table public.marketing_campaign_variants
  add constraint marketing_campaign_variants_channel_check
  check (channel in ('email', 'whatsapp', 'instagram', 'twitter', 'linkedin'));
