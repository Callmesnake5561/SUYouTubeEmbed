// Remove everything under the "Game NFO" marker in the original page
function removeBelowGameNfo() {
  // Main content container (stay conservative)
  const main = document.querySelector("article, .post, .entry-content, .post-content") || document.body;

  // Don’t touch our overlay or Disqus
  const isProtected = (el) =>
    !el ||
    el.closest("[data-suinfocard]") ||
    el.id === "disqus_thread";

  // Find an element that contains "Game NFO" or "Game Info"
  const candidates = [...main.querySelectorAll("*")].filter(el => {
    const t = (el.textContent || "").trim().toLowerCase();
    return /game nfo|game info/.test(t);
  });

  // Choose the top-most candidate (closest to the content top)
  const marker = candidates.length ? candidates.reduce((a, b) => {
    return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? a : b;
  }) : null;

  if (marker) {
    let cursor = marker.nextSibling;
    while (cursor) {
      const next = cursor.nextSibling;
      // Skip protected nodes
      if (cursor.nodeType === Node.ELEMENT_NODE && isProtected(cursor)) {
        cursor = next;
        continue;
      }
      // Remove non-protected nodes after the marker
      try { cursor.remove(); } catch {}
      cursor = next;
    }
    return true;
  }

  // Fallback: if we didn’t find the marker, hide the original content (keep Disqus and overlay)
  const originalBlocks = [...main.children];
  originalBlocks.forEach(el => {
    if (isProtected(el)) return;
    el.style.display = "none";
  });

  return false;
}
