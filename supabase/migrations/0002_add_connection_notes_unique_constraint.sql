-- Add unique constraint to connection_notes for upsert functionality
-- This allows one note per author-peer pair

alter table public.connection_notes
add constraint connection_notes_author_peer_unique unique (author_id, peer_id);
