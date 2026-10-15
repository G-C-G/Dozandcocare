#!/usr/bin/env python3
"""Builds a single-file page from app/ (inlines CSS, JS and the logo) for publishing as a claude.ai Artifact.
Usage: python3 scripts/make-artifact.py OUTPUT.html"""
import base64, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "app"
html = (root / "index.html").read_text()
css = (root / "styles.css").read_text()
js = (root / "app.js").read_text()
logo = base64.b64encode((root / "logo.jpg").read_bytes()).decode()
uri = "data:image/jpeg;base64," + logo
js = js.replace("LOGO = 'logo.jpg'", "LOGO = '" + uri + "'")
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = body.replace('<script src="app.js"></script>', "").replace('src="logo.jpg"', 'src="data:image/jpeg;base64,%s"' % logo)
out = ('<title>Doz and CoCare Trips</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
       '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">\n'
       '<style>\n%s\n</style>\n%s\n<script>\n%s\n</script>\n' % (css, body, js))
pathlib.Path(sys.argv[1]).write_text(out)
print("wrote", sys.argv[1], len(out) // 1024, "KB")
