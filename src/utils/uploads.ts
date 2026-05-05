export async function uploadAsset(file: File, prefix: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("prefix", prefix);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.publicUrl) {
    throw new Error(data?.error || "Upload failed");
  }

  return data.publicUrl as string;
}
