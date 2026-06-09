-- 004a - Run this FIRST in Supabase SQL Editor, then run 004_civic_lifecycle.sql
-- PostgreSQL requires new enum values to be committed before they can be used elsewhere.

alter type public.report_status add value if not exists 'pending';
alter type public.report_status add value if not exists 'flagged';
alter type public.report_status add value if not exists 'rejected';
