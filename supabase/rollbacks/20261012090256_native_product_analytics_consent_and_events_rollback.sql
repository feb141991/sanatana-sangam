-- Destructive rollback: removes all opt-in product analytics history and
-- resets the consent field. Do not run after production use without approval.
select cron.unschedule('purge-native-product-analytics-daily');
drop trigger if exists purge_native_product_analytics_on_consent_change on public.profiles;
drop function if exists public.purge_native_product_analytics_on_consent_change();
drop function if exists public.record_native_product_analytics(text[], text, text);
drop function if exists public.withdraw_native_product_analytics();
drop function if exists public.get_native_product_analytics_summary(integer);
drop table if exists public.native_product_analytics_daily;
alter table public.profiles drop column if exists consent_product_analytics;
