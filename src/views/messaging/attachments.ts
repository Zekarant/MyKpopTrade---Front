import messagingService from '@/services/messaging.service'

/**
 * URL d'une pièce jointe, via la route authentifiée qui vérifie l'appartenance
 * à la conversation.
 *
 * Ces images étaient auparavant chargées depuis /uploads/chat_attachments/,
 * servi en statique sans authentification : n'importe qui connaissant le nom du
 * fichier pouvait lire une pièce jointe de conversation privée.
 */
export function attachmentUrl(messageId: unknown, attachmentName: unknown): string {
  if (!messageId || !attachmentName) return ''
  return messagingService.getAttachmentUrl(String(messageId), String(attachmentName))
}

/** URLs des pièces jointes d'un message, dans l'ordre d'affichage. */
export function messageAttachmentUrls(message: { _id?: string; id?: string; attachments?: string[] } | null | undefined): string[] {
  const messageId = message?._id || message?.id
  return (message?.attachments || []).map((name) => attachmentUrl(messageId, name))
}

/** URLs des médias d'une conversation ; chaque média porte son propre messageId. */
export function conversationMediaUrls(
  conversation: { media?: Array<{ messageId: string; filename: string }> } | null | undefined
): string[] {
  return (conversation?.media || []).map((item) => attachmentUrl(item.messageId, item.filename))
}
