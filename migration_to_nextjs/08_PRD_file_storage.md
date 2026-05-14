# PRD 08 — File Storage

## Objective

Replace AWS S3 file storage with Supabase Storage. All file upload, download, delete, and signed URL generation moves to Supabase Storage buckets.

## Current System

### AWS S3 Usage

Files are stored in S3 buckets. The Django backend (`api_projects/s3_utils.py`, `api_services/utils.py`) handles:
- Upload: `POST /api/projects/upload/project/<id>/file/`
- Delete: `DELETE /api/projects/delete/file/<id>/project/<folder>/<file>/`
- Signed URL generation: `GET /api/projects/get-file-url/`
- ZIP archive download: `POST /api/projects/download/files/`
- MongoDB backup to S3: `backend_app/blur_image.py`, `api_projects/tasks.py::task_generate_db_backup`

Files are stored at paths like: `projects/{project_id}/{folder}/{filename}`.

### Current File Metadata

Stored in MongoDB collections, now in Supabase:
- `project_attachments` — `{name, description, file_url, folder, is_active}`
- `project_task_attachments` — `{name, description, file_url, ...}`
- `project_task_comment_attachments` — `{name, file_url}`
- `service_attachments` — `{name, file_url}`
- `measurement_attachments` — empty (0 rows)
- `measurement_comments.comment_attachments` — JSONB array `[{name, file_url}]`

## Target: Supabase Storage

### Buckets (already defined in `supabase/config.toml`)

```sql
-- Create buckets (run once in Supabase dashboard or via SQL):
INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-attachments', 'project-attachments', false),
  ('service-attachments', 'service-attachments', false),
  ('measurement-attachments', 'measurement-attachments', false),
  ('avatars', 'avatars', true);
```

Bucket policies:
- `project-attachments`, `service-attachments`, `measurement-attachments` — **private** (requires signed URL)
- `avatars` — **public** (direct URL access)

### Storage Path Convention

```
project-attachments/
  {project_id}/{filename}

service-attachments/
  {service_id}/{filename}

measurement-attachments/
  {measurement_id}/{filename}

avatars/
  {user_id}/{filename}
```

### Server Actions (`actions/files.ts`)

```typescript
// Upload file — runs on server, uses service role to bypass RLS on storage
export async function uploadProjectFile(projectId: string, file: File): Promise<string> {
  const supabase = createServiceRoleClient()  // from lib/supabase/server.ts
  const path = `${projectId}/${file.name}`
  const { data, error } = await supabase.storage
    .from("project-attachments")
    .upload(path, file, { upsert: false })
  if (error) throw error
  // Insert metadata row
  await supabase.from("project_attachments").insert({
    project_id: projectId,
    name: file.name,
    file_url: path,
    is_active: true,
  })
  return path
}

export async function deleteProjectFile(projectId: string, filePath: string): Promise<void> {
  const supabase = createServiceRoleClient()
  await supabase.storage.from("project-attachments").remove([filePath])
  await supabase.from("project_attachments").update({ is_active: false })
    .eq("project_id", projectId).eq("file_url", filePath)
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  return data?.signedUrl ?? ""
}

// Service attachments
export async function uploadServiceFile(serviceId: string, file: File): Promise<string>
export async function deleteServiceFile(serviceId: string, filePath: string): Promise<void>

// Measurement attachments
export async function uploadMeasurementFile(measurementId: string, file: File): Promise<string>
```

### File Upload Component

Create `components/shared/FileUpload.tsx` (client component):

```typescript
"use client"
// Drag-and-drop or click-to-browse
// Uses native fetch to call a Route Handler that proxies to Supabase Storage
// Shows upload progress bar
// On success: calls revalidatePath or uses optimistic update
```

Use Next.js Route Handler for streaming uploads (avoids Server Action 4MB body limit):

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  const bucket = formData.get("bucket") as string
  const path = formData.get("path") as string

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ path: data.path })
}
```

### ZIP Download

The current system generates ZIP archives from S3 files. Replace with:

```typescript
// app/api/download/route.ts
export async function POST(request: Request) {
  const { bucket, paths } = await request.json()
  const supabase = createServiceRoleClient()

  // Generate signed URLs for all files
  const { data: signedUrls } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, 300)

  // Download files and stream as ZIP using JSZip or archiver
  // Return as application/zip response
}
```

### Avatar Upload

User avatars upload to the `avatars` bucket (public). Update `users.avatar_url` to store the public URL:

```typescript
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createServiceRoleClient()
  const path = `${userId}/avatar.${file.name.split(".").pop()}`
  await supabase.storage.from("avatars").upload(path, file, { upsert: true })
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
  await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId)
  return publicUrl
}
```

### RLS Policies on Storage

```sql
-- supabase/migrations/016_storage_policies.sql

-- project-attachments: authenticated users can read/write
CREATE POLICY "Authenticated users can read project attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload project attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their project attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-attachments' AND auth.role() = 'authenticated');

-- Repeat for service-attachments, measurement-attachments
-- avatars bucket is public — no RLS needed
```

## Migration of Existing File URLs

Existing `file_url` values in `project_attachments`, `service_attachments`, etc. are S3 URLs or relative paths. A one-time migration script needs to:
1. Download each file from S3
2. Re-upload to Supabase Storage
3. Update the `file_url` column with the new Supabase Storage path

This is a separate migration task outside the PRD scope — document in a `migration_to_nextjs/STORAGE_MIGRATION.md` when ready.

## What to Remove After Completion

- `backend_app/api_projects/s3_utils.py`
- `backend_app/api_services/utils.py` (S3 portions)
- `backend_app/blur_image.py`
- `boto3` Python package (only used for S3)
- AWS credentials from backend `.env`
