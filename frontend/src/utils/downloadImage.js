/**
 * downloadImage - Robust client-side utility to download photos to phone or computer
 * 
 * @param {string} url - Image source URL (remote CDN or data URL)
 * @param {string} [filename="onboard-photo.jpg"] - Suggested download filename
 * @returns {Promise<boolean>} - Resolves true if download was triggered
 */
export async function downloadImage(url, filename = "onboard-photo.jpg") {
  if (!url) {
    console.error("downloadImage: No image URL provided");
    return false;
  }

  // Ensure file has an appropriate extension
  let safeFilename = filename.trim();
  if (!/\.(jpe?g|png|webp|gif)$/i.test(safeFilename)) {
    safeFilename += ".jpg";
  }

  try {
    // 1. Try fetching as Blob (gives best native download experience with custom filename)
    const response = await fetch(url, {
      mode: "cors",
      headers: { "Cache-Control": "no-cache" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.style.display = "none";
    anchor.href = objectUrl;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke object URL after delay to release memory
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 2000);

    return true;
  } catch (err) {
    console.warn("Direct blob download failed, trying anchor fallback:", err);

    try {
      // 2. Fallback to direct anchor download
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.download = safeFilename;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return true;
    } catch (fallbackErr) {
      console.error("All download attempts failed, opening in new tab:", fallbackErr);
      window.open(url, "_blank");
      return false;
    }
  }
}
