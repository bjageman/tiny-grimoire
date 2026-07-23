export async function copyText(text: string): Promise<boolean> {
  const hasClipboardApi = window.isSecureContext && typeof navigator.clipboard?.writeText === 'function';
  if (hasClipboardApi) {
    const written = await navigator.clipboard.writeText(text).then(() => true, () => false);
    if (written) return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied: boolean;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  if (previous && selection) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return copied;
}
