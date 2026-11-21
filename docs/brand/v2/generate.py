import math, os, sys
OUT = sys.argv[1]
SW = 10            # xətt qalınlığı
BASE, XTOP, ASC = 64, 30, 12   # baza xətti, x-hündürlük, yuxarı çıxıntı
R = (BASE - XTOP) / 2 - SW / 2  # dairə radiusu
CY = (BASE + XTOP) / 2
ORANGE, DEEP, SUN, WARM, INK = '#ff7a00', '#e8590c', '#ffc23c', '#ff9f1c', '#2a1a10'
# hərf mövqeləri (x)
P = dict(o1=22, d=63, i=93, o2=123, l=153, a=183)
W = 212

def circ(cx, col): return f'<circle cx="{cx}" cy="{CY}" r="{R}" fill="none" stroke="{col}" stroke-width="{SW}"/>'
def stem(x, y1, col): return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{BASE}" stroke="{col}" stroke-width="{SW}" stroke-linecap="round"/>'
def letters(col, skip=(), ola=None, idot=True):
    c2 = ola or col
    s = []
    if 'o1' not in skip: s.append(circ(P['o1'], col))
    if 'd' not in skip: s += [circ(P['d'], col), stem(P['d'] + R, ASC, col)]
    if 'i' not in skip:
        s.append(stem(P['i'], XTOP + 2, col))
        if idot: s.append(f'<circle cx="{P["i"]}" cy="{ASC + 4}" r="{SW*0.62}" fill="{col}"/>')
    if 'o2' not in skip: s.append(circ(P['o2'], c2))
    if 'l' not in skip: s.append(stem(P['l'], ASC, c2))
    if 'a' not in skip: s += [circ(P['a'], c2), stem(P['a'] + R, XTOP + 2, c2)]
    return ''.join(s)

def sun(cx, cy, r, rays=True, grad='gs'):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{grad})"/>'
    if rays:
        for k in range(8):
            a = k * math.pi / 4
            x1, y1 = cx + math.cos(a)*(r+4), cy + math.sin(a)*(r+4)
            x2, y2 = cx + math.cos(a)*(r+9), cy + math.sin(a)*(r+9)
            s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{WARM}" stroke-width="3.2" stroke-linecap="round"/>'
    return s

DEFS = f'''<defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SUN}"/><stop offset="1" stop-color="{ORANGE}"/></linearGradient>
<linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="212" y2="0"><stop offset="0" stop-color="{DEEP}"/><stop offset=".55" stop-color="{ORANGE}"/><stop offset="1" stop-color="{SUN}"/></linearGradient>
<clipPath id="half"><rect x="0" y="0" width="300" height="{CY+3}"/></clipPath></defs>'''

V = {}
# 1 — Gündoğumu "o": ilk o doğan günəşdir (dairə + üfüq xətti)
V['1-sunrise'] = (letters(INK, skip=('o1',), ola=ORANGE) +
    f'<clipPath id="sr"><rect x="0" y="0" width="300" height="{CY+4}"/></clipPath>' +
    f'<g clip-path="url(#sr)">{sun(P["o1"], CY+4, R+SW/2, rays=False)}</g>' +
    f'<line x1="{P["o1"]-R-SW/2+1}" y1="{CY+9}" x2="{P["o1"]+R+SW/2-1}" y2="{CY+9}" stroke="{ORANGE}" stroke-width="4" stroke-linecap="round"/>' +
    f'<line x1="{P["o1"]-R+3}" y1="{CY+15.5}" x2="{P["o1"]+R-3}" y2="{CY+15.5}" stroke="{WARM}" stroke-width="4" stroke-linecap="round"/>', 'gündoğumu')
# 2 — Günəşli "i": i-nin nöqtəsi şüalı günəşdir
V['2-sun-dot'] = (letters(INK, ola=INK, idot=False) + sun(P['i'], ASC + 1, 7.5), 'i-nöqtəsi')
# 3 — Uçuş "i": i-nin nöqtəsi təyyarə, arxasında qövs izi
plane = lambda x, y, ang: (f'<g transform="translate({x} {y}) rotate({ang})">'
    f'<path d="M-9 0 L9 0 M2 0 L-3 -8 M2 0 L-3 8 M-8 0 L-11 -4 M-8 0 L-11 4" stroke="{ORANGE}" stroke-width="3.4" stroke-linecap="round" fill="none"/></g>')
V['3-flight'] = (letters(INK, ola=ORANGE, idot=False) +
    f'<path d="M{P["o1"]-18} {ASC+20} Q {P["d"]} -6 {P["i"]-10} {ASC+6}" fill="none" stroke="{WARM}" stroke-width="2.6" stroke-dasharray="3 5" stroke-linecap="round"/>' +
    plane(P['i'] + 1, ASC + 3, 8), 'uçuş')
# 4 — "Hola" gülüşü: qradiyent yazı + "ola" altında gülüş qövsü
V['4-smile'] = (letters('url(#gt)') +
    f'<path d="M{P["o2"]-14} {BASE+12} Q {P["l"]+6} {BASE+30} {P["a"]+R+8} {BASE+8}" fill="none" stroke="{ORANGE}" stroke-width="5" stroke-linecap="round"/>' +
    f'<path d="M{P["a"]+R+8} {BASE+8} l-9 1 M{P["a"]+R+8} {BASE+8} l-3 8" stroke="{ORANGE}" stroke-width="5" stroke-linecap="round"/>', 'gülüş')
# 5 — Palma "l": l palma gövdəsi, ikinci o günəş
leaves = ''.join(f'<path d="M{P["l"]} {ASC+2} q {dx*0.55} {dy*0.2-8} {dx} {dy}" fill="none" stroke="{DEEP}" stroke-width="4.5" stroke-linecap="round"/>'
                 for dx, dy in [(-16, 6), (-12, 14), (16, 6), (12, 14), (0, -2)])
V['5-palm'] = (letters(INK, skip=('l', 'o2'), ola=INK) + stem(P['l'], ASC + 4, DEEP) + leaves +
    f'<circle cx="{P["o2"]}" cy="{CY}" r="{R+SW/2}" fill="url(#gs)"/>', 'palma')
# 6 — Yer kürəsi "o": ikinci o meridianlı dünya
GR = R + 3
V['6-globe'] = (letters(INK, skip=('o2',), ola=INK) +
    f'<circle cx="{P["o2"]}" cy="{CY}" r="{GR}" fill="none" stroke="{ORANGE}" stroke-width="5.5"/>' +
    f'<ellipse cx="{P["o2"]}" cy="{CY}" rx="{GR*0.42}" ry="{GR}" fill="none" stroke="{ORANGE}" stroke-width="3"/>' +
    f'<line x1="{P["o2"]-GR}" y1="{CY}" x2="{P["o2"]+GR}" y2="{CY}" stroke="{ORANGE}" stroke-width="3"/>' +
    sun(P['i'], ASC + 1, 6.5, rays=False), 'dünya')

def svg(body, w=W, h=92, bg=None, dark=False):
    if dark: body = body.replace(INK, '#fff7ed')
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Odiola">{DEFS}{b}{body}</svg>\n'

# ikonlar: hər variantın simvol hərfi narıncı kvadratda
ICON = {
 '1-sunrise': f'<g transform="translate(6 -6)"><g clip-path="url(#half)">{sun(26, CY+3, R+SW/2, rays=False)}</g><line x1="2" y1="{CY+8}" x2="50" y2="{CY+8}" stroke="#fff" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="{CY+16}" x2="42" y2="{CY+16}" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>',
}
os.makedirs(OUT, exist_ok=True)
for k, (body, _) in V.items():
    open(f'{OUT}/odiola-{k}.svg', 'w').write(svg(body))
    open(f'{OUT}/odiola-{k}-dark.svg', 'w').write(svg(body, dark=True))
print('ok', len(V))
