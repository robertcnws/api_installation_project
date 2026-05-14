"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  number: z.string().min(1, "Number is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  reference_number: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  work_scope: z.string().optional(),
  current_stage_id: z.string().uuid().optional(),
  user_manager_id: z.string().uuid().optional(),
  user_installer_id: z.string().uuid().optional(),
});

export async function createProject(formData: FormData) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = projectSchema.parse(Object.fromEntries(formData));

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed, user_reporter_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  return data;
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = projectSchema.partial().parse(Object.fromEntries(formData));

  const { data, error } = await supabase
    .from("projects")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return data;
}

export async function deleteProject(id: string) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("projects")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
}
