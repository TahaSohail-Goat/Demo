# Verification

Checked in Chromium on 27 September 2026.

- Responsive layouts at 320, 375, 390, 600, 768, 1024, 1440 and 1920 pixels: no horizontal overflow.
- Desktop and mobile screenshots visually reviewed; original artwork and embedded fonts load.
- Mobile menu opens, updates its accessible state, and closes after navigation.
- Each look opens its own enquiry, description and indicative price.
- Clothing sizes update the message; custom message text is preserved when changing size.
- The one-size dupatta and general enquiry omit clothing size controls.
- WhatsApp URL includes the edited, encoded message. With no configured number, it uses the contact chooser.
- Escape closes the modal and returns focus to its trigger.
- Tab and Shift+Tab cycle within the enquiry. Copy message writes the exact edited text to the clipboard in a secure local context.
- Reduced motion disables smooth scrolling and transitions.
- Direct `file://` opening works, with zero external font, image or script requests.
- With JavaScript disabled, content remains readable and the contact section keeps a WhatsApp share link.
- The directory page links to the boutique demo.
- No JavaScript page errors during checks.
- axe-core 4.10.3 reported no WCAG 2 A/AA or WCAG 2.1 AA violations for the desktop page, 320-pixel mobile page, and open enquiry dialog. Automated checks do not replace a full manual accessibility audit.

The self-contained page is approximately 578 KiB, including the hero image, six font subsets, licenses, CSS, JavaScript and SVG illustrations. No installation or runtime dependencies are required.

Vercel configuration is supplied but a public Vercel deployment has not been created or tested. External WhatsApp delivery and a real Instagram profile require the client’s configured contact details; no message was sent during verification.
