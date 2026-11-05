-- Rollback for 20261105100000_sanskara_manager_picker.sql. The two functions only read; dropping them changes no data.
begin;
set local lock_timeout = '5s';
drop function public.sanskara_sole_manager_dependents();
drop function public.sanskara_manager_picker(uuid);
commit;
