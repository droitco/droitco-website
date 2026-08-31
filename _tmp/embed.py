#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
TMP = Path(__file__).resolve().parent
Q = chr(34)

PHOTOS = [
    dict(
        alt='Edgewood Storage, Mosinee — drive-up units',
        file='edgewood.b64.txt',
        width=400,
        height=161,
        schema_old='https://droitco.github.io/droitco-website/img/edgewood-exterior.jpg',
    ),
    dict(
        alt='Southview Mini Warehouses, Eau Claire — facility exterior',
        file='southview.b64.txt',
        width=400,
        height=225,
        schema_old='https://droitco.github.io/droitco-website/img/southview-exterior.jpg',
    ),
    dict(
        alt='Smart Self Storage, Dayton — drive aisle',
        file='dayton.b64.txt',
        width=400,
        height=225,
        schema_old='https://droitco.github.io/droitco-website/img/dayton-exterior.jpg',
    ),
]


def patch(html):
    for p in PHOTOS:
        b64 = (TMP / p['file']).read_text(encoding='utf-8').strip()
        if not b64.startswith('/9j/'):
            raise SystemExit('bad jpeg b64 in ' + p['file'])
        uri = 'data:image/jpeg;base64,' + b64
        alt = p['alt']
        needle = 'alt=' + Q + alt + Q
        src_re = r'\ssrc=' + Q + '[^' + Q + ']*' + Q
        w_re = r'\swidth=' + Q + '[^' + Q + ']*' + Q
        h_re = r'\sheight=' + Q + '[^' + Q + ']*' + Q

        def repl_img(m, needle=needle, uri=uri, width=p['width'], height=p['height'], src_re=src_re, w_re=w_re, h_re=h_re):
            tag = m.group(0)
            if needle not in tag:
                return tag
            tag = re.sub(src_re, ' src=' + Q + uri + Q, tag, count=1)
            tag = re.sub(w_re, ' width=' + Q + str(width) + Q, tag, count=1)
            tag = re.sub(h_re, ' height=' + Q + str(height) + Q, tag, count=1)
            return tag

        html = re.sub(r'<img\b[^>]*>', repl_img, html, flags=re.IGNORECASE)
        old = Q + 'image' + Q + ': ' + Q + p['schema_old'] + Q
        new = Q + 'image' + Q + ': ' + Q + uri + Q
        html = html.replace(old, new)
    for b in ('PLACEHOLDER_WILL_BE_EXACT', 'FILE_CONTENT_FROM_LOCAL_SVG', 'USE_FILE'):
        if b in html:
            raise SystemExit('refusing to write ' + b)
    return html


def main():
    idx = (ROOT / 'index.html').read_text(encoding='utf-8')
    if 'Edgewood Storage, Mosinee' in idx and 'src=' + Q + 'data:image/jpeg;base64,' in idx:
        for tag in re.findall(r'<img\b[^>]*>', idx):
            if 'Edgewood Storage, Mosinee' in tag and 'data:image/jpeg;base64,' in tag:
                print('already embedded; skip')
                return
    for name in ('index.html', 'locations.html'):
        path = ROOT / name
        original = path.read_text(encoding='utf-8')
        updated = patch(original)
        if updated == original:
            raise SystemExit('no replacements in ' + name)
        path.write_text(updated, encoding='utf-8')
        print('patched ' + name + ': ' + str(len(original)) + ' -> ' + str(len(updated)) + ' bytes')


if __name__ == '__main__':
    main()
