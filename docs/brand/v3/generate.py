# Odiola loqosu v3: qradiyentli yazı (v2 #4) + "i" üstündə günəş (v2 #2) + birinci "o" yer kürəsi + uçuş izi və təyyarə
import math, os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
T = 24                      # yuxarıda təyyarə üçün boşluq
SW = 10
BASE, XTOP, ASC = 64 + T, 30 + T, 12 + T
R = (BASE - XTOP) / 2 - SW / 2
CY = (BASE + XTOP) / 2
ORANGE, DEEP, SUN, WARM, INK = '#ff7a00', '#e8590c', '#ffc23c', '#ff9f1c', '#2a1a10'
P = dict(o1=24, d=65, i=100, o2=132, l=162, a=192)
W, H = 234, BASE + 8

DEFS = f'''<defs>
<linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="210" y2="0"><stop offset="0" stop-color="{DEEP}"/><stop offset=".55" stop-color="{ORANGE}"/><stop offset="1" stop-color="{SUN}"/></linearGradient>
<radialGradient id="gs" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe08a"/><stop offset=".6" stop-color="{SUN}"/><stop offset="1" stop-color="{ORANGE}"/></radialGradient>
</defs>'''

def circ(cx, col, w=SW, r=R): return f'<circle cx="{cx}" cy="{CY}" r="{r}" fill="none" stroke="{col}" stroke-width="{w}"/>'
def stem(x, y1, col): return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{BASE}" stroke="{col}" stroke-width="{SW}" stroke-linecap="round"/>'

def globe(cx, col):
    gr = R + 3.5
    return (f'<circle cx="{cx}" cy="{CY}" r="{gr}" fill="none" stroke="{col}" stroke-width="6"/>'
            f'<ellipse cx="{cx}" cy="{CY}" rx="{gr*0.4}" ry="{gr-1}" fill="none" stroke="{col}" stroke-width="3.4"/>'
            f'<path d="M{cx-gr+1} {CY} H{cx+gr-1}" stroke="{col}" stroke-width="3.4"/>')

def sun(cx, cy, r=6.6):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#gs)"/>'
    for k in range(8):
        a = k * math.pi / 4
        x1, y1 = cx + math.cos(a) * (r + 3.2), cy + math.sin(a) * (r + 3.2)
        x2, y2 = cx + math.cos(a) * (r + 7.2), cy + math.sin(a) * (r + 7.2)
        s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{WARM}" stroke-width="3" stroke-linecap="round"/>'
    return s

PLANE = 'M11 0 C11 -1.6 9 -2.2 7 -2.2 L2 -2.2 L-5 -10 L-8.5 -10 L-4.5 -2.2 L-10 -2.2 L-13 -6 L-15.5 -6 L-13.5 0 L-15.5 6 L-13 6 L-10 2.2 L-4.5 2.2 L-8.5 10 L-5 10 L2 2.2 L7 2.2 C9 2.2 11 1.6 11 0 Z'
def plane(x, y, ang, col): return f'<path d="{PLANE}" fill="{col}" transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f}) scale(.82)"/>'

def flight(x0, y0, cx, cy, x1, y1, col_path, col_plane):
    ang = math.degrees(math.atan2(y1 - cy, x1 - cx))
    # xətt təyyarənin quyruğunda bitir
    bx, by = x1 - math.cos(math.radians(ang)) * 13, y1 - math.sin(math.radians(ang)) * 13
    return (f'<path d="M{x0} {y0} Q{cx} {cy} {bx:.1f} {by:.1f}" fill="none" stroke="{col_path}" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round"/>'
            + plane(x1, y1, ang, col_plane))

def word(ink_odi, ink_ola):
    return (globe(P['o1'], ink_odi) + circ(P['d'], ink_odi) + stem(P['d'] + R, ASC, ink_odi)
            + stem(P['i'], XTOP + 2, ink_odi) + sun(P['i'], ASC + 2)
            + circ(P['o2'], ink_ola) + stem(P['l'], ASC, ink_ola)
            + circ(P['a'], ink_ola) + stem(P['a'] + R, XTOP + 2, ink_ola))

G = 'url(#gt)'
V = {
  # A — tam qradiyent; uçuş izi kürədən başlayıb günəşin üstündən keçir, təyyarə sağda
  'a-globe-flight': lambda dark: word(G, G) + flight(P['o1'] - 6, CY - R - 10, 105, -14, P['a'] + 24, ASC - 4, WARM, ORANGE),
  # B — tam qradiyent; qısa uçuş izi yalnız "ola" üzərində (günəşdən sonra)
  'b-short-flight': lambda dark: word(G, G) + flight(P['i'] + 24, ASC - 2, 168, -8, P['a'] + 24, ASC - 2, WARM, ORANGE),
  # C — "odi" tünd, "ola" qradiyent (kontrast); uzun uçuş izi
  'c-two-tone': lambda dark: word('#fff7ed' if dark else INK, G) + flight(P['o1'] - 6, CY - R - 10, 105, -14, P['a'] + 24, ASC - 4, WARM, ORANGE),
}

def svg(body, w=W, h=H): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Odiola">{DEFS}{body}</svg>\n'
os.makedirs(OUT, exist_ok=True)
for k, f in V.items():
    open(f'{OUT}/odiola-{k}.svg', 'w').write(svg(f(False)))
    open(f'{OUT}/odiola-{k}-dark.svg', 'w').write(svg(f(True)))
# ikon: günəşli "i" yox — kürə + təyyarə, narıncı fonda (favicon/tətbiq ikonu)
icon = (f'<rect width="64" height="64" rx="14" fill="url(#gt)"/>'
        f'<g transform="translate({32-P["o1"]} {34-CY})">{globe(P["o1"], "#fff")}</g>'
        + plane(48, 14, -28, '#fff'))
open(f'{OUT}/odiola-icon.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Odiola"><defs><linearGradient id="gt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{DEEP}"/><stop offset="1" stop-color="{SUN}"/></linearGradient></defs>{icon}</svg>\n')
print('ok')
