-- Optional stake label for challenge invites (honor-only, no payments).
alter table public.challenges
  add column if not exists stake_label text;
