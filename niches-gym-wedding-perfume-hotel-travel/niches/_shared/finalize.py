"""Finalize a site: insert shared base CSS into styles.css (inside the components layer), copy core.js, inline icons."""
import sys, os, shutil, subprocess
site = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
css_p = os.path.join(site, 'assets/css/styles.css')
css = open(css_p).read()
base = open(os.path.join(here, 'base.css')).read()
if 'shared base (from' not in css:
    css = css.replace('@layer components {', '@layer components {\n' + base, 1)
    open(css_p, 'w').write(css)
shutil.copy(os.path.join(here, 'core.js'), os.path.join(site, 'assets/js/core.js'))
subprocess.run(['python3', os.path.join(here, 'icons.py'), os.path.join(site, 'index.html')], check=True)
print('finalized', site)
