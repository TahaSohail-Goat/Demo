"""Replace {{i:name}} / {{i:name:extra-class}} tokens in HTML/JS files with inline Lucide SVGs (ISC licence).
Usage: python3 icons.py path/to/index.html [more files...]"""
import sys, re, os
ICON_DIR = os.environ.get('LUCIDE_DIR', os.path.join(os.getcwd(), 'node_modules/lucide-static/icons'))
def svg(name, cls=''):
    raw = open(os.path.join(ICON_DIR, name + '.svg')).read()
    raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)
    raw = re.sub(r'\s+', ' ', raw).strip()
    raw = re.sub(r'class="[^"]*"', 'class="ic' + ((' ' + cls) if cls else '') + '"', raw)
    raw = raw.replace('width="24" height="24"', 'width="24" height="24" aria-hidden="true" focusable="false"')
    return raw.replace('> <', '><').replace(' />', '/>')
for f in sys.argv[1:]:
    s = open(f).read()
    n = 0
    def rep(m):
        global n; n += 1
        return svg(m.group(1), m.group(2) or '')
    s = re.sub(r'\{\{i:([a-z0-9-]+)(?::([a-z0-9 _-]+))?\}\}', rep, s)
    open(f, 'w').write(s)
    print(f'{f}: {n} icons inlined')
