export function printHtmlDocument(html: string) {
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.style.position = "fixed"
  frame.style.right = "0"
  frame.style.bottom = "0"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    document.body.removeChild(frame)
    throw new Error("Could not open print frame")
  }

  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    window.setTimeout(() => {
      if (frame.parentNode) document.body.removeChild(frame)
    }, 500)
  }

  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    cleanup()
  }
}
