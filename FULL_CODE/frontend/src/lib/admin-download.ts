import { API_BASE, ApiError, getToken } from "@/lib/api";

/** Downloads a file from an admin endpoint. The session token goes in the header, never in the URL. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok)
    throw new ApiError(res.status === 403 ? "You are not allowed to export this." : "The export failed. Please try again.", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
