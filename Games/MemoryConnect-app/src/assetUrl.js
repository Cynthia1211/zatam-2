const staticAssetHost = "https://memory-connect-somya-20261014.web.app";

export function getStaticAssetUrl(path) {
  const relativePath = String(path ?? "").replace(/^\.?(\/)+/, "");

  // Keep local development self-contained, while the published GitHub Pages
  // game fetches its larger media files from the Firebase asset host.
  if (import.meta.env.DEV) {
    return `./${relativePath}`;
  }

  return `${staticAssetHost}/${relativePath}`;
}
