"""Room 'window view' SVG illustrations for Kestrel House ({{view:dawn|day|dusk}} tokens)."""
import sys, random, math
def ridge(seed, base, amp, n=40, w=400):
    random.seed(seed); pts = []
    for i in range(n + 1):
        x = w * i / n
        y = base - amp * (0.55 * math.sin(i * 0.37 + seed) + 0.3 * math.sin(i * 0.91 + seed * 2) + 0.15 * random.random())
        pts.append((x, y))
    return pts
def poly(pts, h=250): return 'M0 %d ' % h + ' '.join(f'L{x:.1f} {y:.1f}' for x, y in pts) + f' L400 {h} Z'
def view(kind):
    sky = {'dawn': ('#f6b38a', '#8aa6c9', '#fde3c8'), 'day': ('#7fb7e6', '#cfe6f5', '#ffffff'), 'dusk': ('#2b3a67', '#e58a5a', '#ffd9a0')}[kind]
    top, bot, sun = sky
    peak = 'M120 250 L200 58 L222 84 L236 70 L300 250 Z'
    snow = 'M200 58 L222 84 L236 70 L252 104 L238 98 L226 112 L212 96 L196 116 L184 96 Z'
    sunx, suny = {'dawn': (86, 150), 'day': (320, 60), 'dusk': (330, 150)}[kind]
    far = poly(ridge(3, 176, 28)); near = poly(ridge(7, 214, 22))
    lake = '<rect x="0" y="222" width="400" height="28" fill="#2aa9b3" opacity=".85"/><rect x="0" y="222" width="400" height="3" fill="#fff" opacity=".35"/>'
    trees = ''.join(f'<circle cx="{x}" cy="{220 - (x % 7)}" r="{6 + (x % 5)}" fill="{"#e9a0a8" if kind == "dawn" and x % 3 == 0 else "#5c7a3a"}"/>' for x in range(10, 400, 22))
    frame = '<rect x="4" y="4" width="392" height="242" fill="none" stroke="#fbfcfb" stroke-width="8"/><path d="M200 4V246M4 125H396" stroke="#fbfcfb" stroke-width="6"/>'
    stars = ''.join(f'<circle cx="{(i * 53) % 400}" cy="{(i * 29) % 90 + 6}" r="1" fill="#fff" opacity=".8"/>' for i in range(30)) if kind == 'dusk' else ''
    return (f'<svg class="view" viewBox="0 0 400 250" role="img" aria-label="Window view at {kind}"><defs><linearGradient id="sky-{kind}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient></defs><rect width="400" height="250" fill="url(#sky-{kind})"/>{stars}'
            f'<circle cx="{sunx}" cy="{suny}" r="18" fill="{sun}" opacity=".95"/><path d="{far}" fill="#6f7f93" opacity=".75"/><path d="{peak}" fill="#56616f"/><path d="{snow}" fill="#f7fbff"/>'
            f'<path d="{near}" fill="#3d4d3a"/>{lake}{trees}{frame}</svg>')
f = sys.argv[1]; s = open(f).read()
for k in ('dawn', 'day', 'dusk'): s = s.replace('{{view:' + k + '}}', view(k))
open(f, 'w').write(s); print('hotel views injected')
