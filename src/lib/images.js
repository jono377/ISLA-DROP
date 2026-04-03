import { supabase } from './supabase'

const BUCKET = 'product-images'
const CDN_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

// ── Get public image URL for a product ───────────────────────
// Tries WebP first (smaller), falls back to PNG, then null
export function getProductImageUrl(productId) {
  if (!productId) return null
  return `${CDN_URL}/${productId}.webp`
}

// ── Upload a product image (used in Ops dashboard) ───────────
export async function uploadProductImage(productId, file) {
  // Convert to webp-friendly name
  const path = `${productId}.webp`

  // Remove existing if present
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {})

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    })

  if (error) throw error
  return `${CDN_URL}/${path}`
}

// ── Delete a product image ────────────────────────────────────
export async function deleteProductImage(productId) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([`${productId}.webp`, `${productId}.png`, `${productId}.jpg`])
  if (error) throw error
}

// ── Check if an image exists (used for fallback logic) ────────
export async function imageExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

// ── SQL to run in Supabase to create the storage bucket ───────
export const STORAGE_SETUP_SQL = `
-- Run this in Supabase SQL Editor to create the product images bucket

-- 1. Create the bucket (or use the Supabase dashboard Storage tab)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2. Allow anyone to read images (public bucket)
create policy "Public can view product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- 3. Allow ops users to upload/delete images
create policy "Ops can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);

create policy "Ops can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);

create policy "Ops can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ops'
  )
);
`
