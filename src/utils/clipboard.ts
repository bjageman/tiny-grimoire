/**
 * navigator.clipboard only exists in a secure context (HTTPS or localhost). The dev server
 * binds to the LAN so the app can be opened from a phone at an http://192.168.x.x address,
 * where the modern API is simply absent — hence the execCommand fallback, which still works
 * on plain HTTP. Returns false when both routes fail so callers can tell the user to copy by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through — a rejected permission still leaves the legacy path worth trying.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  // Keep it on-screen-but-invisible: display:none or visibility:hidden would make it unselectable.
  textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  // iOS Safari ignores select() on a readonly textarea unless the range is set explicitly.
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
