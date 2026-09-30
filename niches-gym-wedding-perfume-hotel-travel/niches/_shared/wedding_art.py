"""Generate the three decor-theme SVG illustrations for the Shehnai site and inject them into index.html ({{art:name}} tokens)."""
import math, random, sys
random.seed(7)
ARCH = "M60 300V140C60 96 96 70 132 56C150 49 160 41 164 32C168 41 178 49 196 56C232 70 268 96 268 140V300"
def garland(x0, x1, y, sag, colors, r=4.2, n=22):
    out = []
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t; yy = y + sag * 4 * t * (1 - t)
        c = colors[i % len(colors)]
        out.append(f'<circle cx="{x:.1f}" cy="{yy:.1f}" r="{r}" fill="{c}"/>')
    return ''.join(out)
def drops(xs, y, length, colors, r=3.6):
    out = []
    for k, x in enumerate(xs):
        n = int(length / (r * 2.1))
        for j in range(n):
            out.append(f'<circle cx="{x}" cy="{y + j * r * 2.1:.1f}" r="{r}" fill="{colors[(j + k) % len(colors)]}"/>')
    return ''.join(out)
def art(kind):
    if kind == 'mehndi':
        bg = ('#2f3a12', '#6b7a1c'); frame = '#f2b705'; cols = ['#f29d1f', '#ffc83d', '#e8751a']
        extra = drops(range(84, 250, 18), 72, 150, cols) + ''.join(f'<g transform="translate({x},262)"><ellipse cx="0" cy="8" rx="11" ry="4" fill="#8a4b12"/><path d="M-9 6q9 7 18 0l-3 6h-12z" fill="#c2701f"/><path d="M0 -8q5 6 0 12q-5-6 0-12z" fill="#ffd36b"/></g>' for x in (96, 132, 196, 232))
        swing = '<path d="M140 150v70M188 150v70" stroke="#ffd36b" stroke-width="2"/><rect x="132" y="218" width="64" height="12" rx="4" fill="#c2701f"/>'
        extra += swing
    elif kind == 'baraat':
        bg = ('#3b0712', '#8e1430'); frame = '#e0b252'; cols = ['#d4a64a', '#f3d58a', '#b8872c']
        extra = ''.join(f'<path d="M{x} 60q-10 120 6 240h-26q12-120 20-240z" fill="#a3122f" opacity=".75"/>' for x in (70, 262)) + drops(range(96, 240, 24), 70, 110, cols, 3.2)
        extra += '<rect x="112" y="230" width="104" height="30" rx="6" fill="#d4a64a"/><rect x="120" y="200" width="88" height="32" rx="10" fill="#7c1128" stroke="#f3d58a" stroke-width="2"/>'
    else:
        bg = ('#dfe4e4', '#f7f5ef'); frame = '#b8a57a'; cols = ['#ffffff', '#f3efe4', '#e7e2d4']
        blooms = []
        for i in range(60):
            a = random.random() * math.pi; rr = 110 + random.random() * 30
            x = 164 + math.cos(a) * rr * 0.95; y = 150 - math.sin(a) * rr * 0.8
            blooms.append(f'<g transform="translate({x:.1f},{y:.1f})">' + ''.join(f'<circle cx="{4*math.cos(k*1.2566):.1f}" cy="{4*math.sin(k*1.2566):.1f}" r="3.4" fill="#fff" stroke="#e2dccb" stroke-width=".6"/>' for k in range(5)) + '<circle r="1.8" fill="#e8c46a"/></g>')
        extra = ''.join(blooms) + '<rect x="104" y="226" width="120" height="26" rx="8" fill="#fff" stroke="#d8cfb8"/><path d="M110 226c20-30 88-30 108 0" fill="#f3efe4" stroke="#d8cfb8"/>'
    g0, g1 = bg
    return f'''<svg viewBox="0 0 328 246" role="img" aria-label="{kind} decor sketch" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg-{kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{g0}"/><stop offset="1" stop-color="{g1}"/></linearGradient><radialGradient id="gl-{kind}" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="328" height="246" fill="url(#bg-{kind})"/><rect width="328" height="246" fill="url(#gl-{kind})"/><g transform="translate(0,-40)"><path d="{ARCH}" fill="none" stroke="{frame}" stroke-width="5"/><path d="{ARCH}" fill="none" stroke="{frame}" stroke-width="1.2" transform="translate(12,14) scale(.926)" opacity=".7"/>{garland(60, 268, 74, 36, cols)}{extra}</g><rect y="228" width="328" height="18" fill="#000" opacity=".18"/></svg>'''
f = sys.argv[1]
s = open(f).read()
for k in ('mehndi', 'baraat', 'walima'):
    s = s.replace('{{art:' + k + '}}', art(k))
open(f, 'w').write(s)
print('wedding art injected')
