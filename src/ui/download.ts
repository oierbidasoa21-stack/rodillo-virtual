/** Saves `data` as a pretty-printed JSON file through the browser's download. */
export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Reads a picked file as JSON; null if it isn't valid JSON. */
export async function readJsonFile(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    return null;
  }
}
