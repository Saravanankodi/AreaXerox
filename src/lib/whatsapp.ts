export async function shareDocumentsViaWhatsApp(
  files: File[],
  shopWhatsappNumber?: string,
  message = "I’m preparing a print order with XEROXIFY.",
) {
  const text = message;
  const shareData = { title: "XEROXIFY", text, files };
  if (
    files.length > 0 &&
    navigator.share &&
    (!navigator.canShare || navigator.canShare({ files }))
  ) {
    await navigator.share(shareData);
    return "share-sheet" as const;
  }
  const phone = (shopWhatsappNumber ?? "").replace(/\D/g, "");
  if (!phone) return "unavailable" as const;
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
  return "whatsapp-opened" as const;
}
