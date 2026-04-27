/** Strip simple **bold** markers for plain display (no markdown engine). */
export function plainFromContent(content: string): string {
  return content.replace(/\*\*(.+?)\*\*/g, '$1');
}
