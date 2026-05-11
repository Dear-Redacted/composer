/**
 * Trigger a browser download of text content as a .txt file.
 * Uses native Blob and anchor tag APIs (no external dependencies).
 */
export function downloadTextFile(content: string, filename?: string): void {
  // Generate filename
  const name = filename || `Untitled.txt`;

  // Create a Blob from the content
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

  // Create a temporary data URL
  const url = URL.createObjectURL(blob);

  // Create a hidden anchor element and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
