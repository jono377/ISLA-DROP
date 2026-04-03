-- ============================================================
-- Isla Drop — Supabase Storage Setup
-- Run this in your Supabase SQL Editor AFTER the main schema
-- ============================================================

-- Step 1: Create the product-images storage bucket
-- (You can also do this via the Supabase dashboard:
--  Storage → New Bucket → name: "product-images" → Public: ON)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  3145728, -- 3MB max per image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Step 2: Allow anyone to view images (public bucket)
create policy "Public can view product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Step 3: Allow ops users to upload images
create policy "Ops can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);

-- Step 4: Allow ops users to update/replace images
create policy "Ops can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);

-- Step 5: Allow ops users to delete images
create policy "Ops can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);
