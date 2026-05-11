import { supabase } from "./supabase.js";
import { PHOTO_BUCKET } from "./constants.js";
import { base64ToBlob } from "./image.js";

export async function saveCount({ result, files, user }) {
  const { data: countRow, error: insertErr } = await supabase
    .from("counts")
    .insert({
      recorded_by: user.id,
      campus: result.campus,
      area: result.area,
      service_type: result.serviceType,
      service_date: result.serviceDate,
      multi_angle: result.multiAngle,
      photo_count: result.photoCount,
      total_count: result.total_count,
      stage_count: result.stage_count ?? 0,
      confidence: result.confidence,
      ai_notes: result.notes,
      per_image: result.per_image ?? null,
      raw_response: result.raw_response ?? null,
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  const uploads = await Promise.all(
    files.map(async (f, i) => {
      const path = `${user.id}/${countRow.id}/${i + 1}.jpg`;
      const blob = base64ToBlob(f.base64, f.mediaType);
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, {
          contentType: f.mediaType,
          upsert: false,
        });
      if (upErr) throw upErr;
      return { storage_path: path, image_index: i + 1, count_id: countRow.id };
    })
  );

  if (uploads.length > 0) {
    const { error: photoErr } = await supabase
      .from("count_photos")
      .insert(uploads);
    if (photoErr) throw photoErr;
  }

  return countRow;
}

export async function listCounts({ campus, limit = 50 } = {}) {
  let q = supabase
    .from("counts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (campus && campus !== "All") q = q.eq("campus", campus);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listCountPhotos(countId) {
  const { data, error } = await supabase
    .from("count_photos")
    .select("*")
    .eq("count_id", countId)
    .order("image_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function signedUrlsFor(paths, expiresIn = 300) {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) throw error;
  return data ?? [];
}
