# Verification

Checked locally in Chromium on 29 September 2026.

- Home layout has no horizontal overflow at 320, 390, 768, 1024, and 1440 pixels.
- All six displayed WebP fashion assets load; the total delivered image set is about 1.16 MB.
- Product search, category filters, empty-state reset, sorting, saved pieces, and storage persistence work.
- A piece cannot be added until a size is selected. The size guide converts inches to centimetres and returns to the selected product after Escape.
- The bag updates quantities, subtotal, removal, currency display, and device persistence.
- Local and international destination guidance changes appropriately. Delivery remains explicitly indicative and separate from production.
- Enquiries produce an editable summary of selected pieces, quantities, destination, date and notes; the WhatsApp URL encodes the edited message and nothing is sent automatically.
- The mobile navigation closes after navigation and Escape; product detail dialogs fit a 390-pixel viewport.
- `node --check js/main.js` passes. No JavaScript errors or failed local resource requests occurred during functional checks.
- axe-core reported zero WCAG 2 A/AA and WCAG 2.1 A/AA violations on the desktop home page after the final accessibility adjustments.

The storefront deliberately remains a fictional demonstration. Product availability, shipping costs, payments, delivery commitments, client phone number, policies, catalogue and terms must be supplied before a real launch.
