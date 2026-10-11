"""Native vector artwork + genuinely shaped Arabic outlines, not raster tracing.
Generation tool only: fontTools, uharfbuzz and Brotli; no application dependency.
"""
from pathlib import Path
from io import BytesIO
import json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / 'node_modules/@fontsource-variable/alexandria/files/alexandria-arabic-wght-normal.woff2'
NAME = 'منصتك التعليمية'
INK, IVORY, LIME = '#29233B', '#F6F4ED', '#D8EF73'
# A geometric meem: a connected loop, a descending stem, and an open diamond
# counter. Its segmented terminal is the ecosystem connection, not a book/cap.
SYMBOL = 'M29.17 5.17a4 4 0 0 1 5.66 0L56.83 27.17a4 4 0 0 1 0 5.66L34.83 54.83a4 4 0 0 1-5.66 0L18 43.66V58H8V34.66a6 6 0 0 1 1.76-4.24ZM32 18 18 32l14 14 14-14Z'
font = instantiateVariableFont(TTFont(FONT), {'wght': 600}, inplace=False)
font.flavor = None
binary = BytesIO(); font.save(binary)
face = hb.Face(binary.getvalue()); hfont = hb.Font(face)
upem = font['head'].unitsPerEm
hfont.scale = (upem, upem)
glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
evidence = []

def outline(text, size, x=0, baseline=0):
    buf = hb.Buffer(); buf.add_str(text); buf.direction = 'rtl'; buf.script = 'arab'; buf.language = 'ar'
    hb.shape(hfont, buf, {'kern': True, 'liga': True, 'rlig': True})
    assert all(i.codepoint != 0 for i in buf.glyph_infos), 'Missing glyph'
    scale = size/upem
    cursor, paths = x, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs, ntos=lambda v: format(v, '.2f').rstrip('0').rstrip('.'))
        trans = TransformPen(pen, (scale,0,0,-scale,cursor+pos.x_offset*scale,baseline-pos.y_offset*scale))
        glyphs[order[info.codepoint]].draw(trans)
        path = pen.getCommands()
        if path: paths.append(path)
        cursor += pos.x_advance*scale
    evidence.append({'text':text,'size':size,'glyphs':[order[i.codepoint] for i in buf.glyph_infos],'width':cursor-x,'direction':'rtl','missingGlyphs':0})
    return ' '.join(paths), cursor-x

def svg(width,height,body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{NAME}"><title>{NAME}</title>{body}</svg>\n'

out = ROOT/'public/brand'; out.mkdir(parents=True,exist_ok=True)
primary, word_width = outline(NAME, 40, 0, 53)
width = round(word_width+94)
compact_first, w1 = outline('منصتك',29,0,31)
compact_second, w2 = outline('التعليمية',19,0,55)
compact_width = round(max(w1,w2)+79)
configs = {'light':(INK,INK),'dark':(IVORY,LIME),'mono':('#000000','#000000')}
for theme,(text_color,symbol_color) in configs.items():
    horizontal = svg(width,76,f'<path fill="{text_color}" d="{primary}"/><g transform="translate({width-66} 6)"><path fill="{symbol_color}" fill-rule="evenodd" d="{SYMBOL}"/></g>')
    compact = svg(compact_width,64,f'<path transform="translate({max(w1,w2)-w1} 0)" fill="{text_color}" d="{compact_first}"/><path transform="translate({max(w1,w2)-w2} 0)" fill="{text_color}" d="{compact_second}"/><g transform="translate({compact_width-64} 0)"><path fill="{symbol_color}" fill-rule="evenodd" d="{SYMBOL}"/></g>')
    for key,value in [('primary',horizontal),('compact',compact),('icon',svg(64,64,f'<path fill="{symbol_color}" fill-rule="evenodd" d="{SYMBOL}"/>'))]:
        (out/f'mansatak-{key}-{theme}.svg').write_text(value,encoding='utf8')
        if theme=='light': (out/f'mansatak-{key}.svg').write_text(value,encoding='utf8')
# Color-inheriting source consumed by one reusable React component.
data = f'''/** Generated from editable geometric artwork + HarfBuzz-shaped Alexandria outlines. */
export const logoVectors = {{
  symbol: {json.dumps(SYMBOL)},
  primary: {{ width: {width}, height: 76, word: {json.dumps(primary)}, symbolX: {width-66} }},
  compact: {{ width: {compact_width}, height: 64, first: {json.dumps(compact_first)}, second: {json.dumps(compact_second)}, firstX: {max(w1,w2)-w1}, secondX: {max(w1,w2)-w2}, symbolX: {compact_width-64} }},
}} as const\n'''
# Emit generated source through the repository editing mechanism, never overwrite directly.
print('*** Begin Patch\n*** Add File: '+str(ROOT/'components/brand/logoVectors.ts').replace('\\','/'))
for line in data.splitlines(): print('+'+line)
print('*** End Patch')
(out/'shaping-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf8')
(out/'logo-source.svg').write_text(svg(width,76,f'<g id="arabic-wordmark" fill="{INK}"><path d="{primary}"/></g><g id="geometric-meem" transform="translate({width-66} 6)" fill="{INK}"><path fill-rule="evenodd" d="{SYMBOL}"/></g>'),encoding='utf8')
