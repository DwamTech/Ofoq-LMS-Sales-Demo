"""Standalone art-direction sources. Never writes application assets or code."""
from pathlib import Path
from io import BytesIO
import json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.merge import Merger

HERE = Path(__file__).resolve().parent
FRONTEND = HERE.parents[1] / 'ofuq-frontend-main/ofuq-frontend-main'
FONT = FRONTEND / 'node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2'
LATIN = FRONTEND / 'node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-600-normal.woff2'
font = Merger().merge([str(FONT), str(LATIN)])
font.flavor = None
binary = BytesIO(); font.save(binary)
hfont = hb.Font(hb.Face(binary.getvalue()))
upem = font['head'].unitsPerEm
hfont.scale = (upem, upem)
glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
evidence = []

def outline(text, size, x=0, baseline=0):
    buf = hb.Buffer(); buf.add_str(text); buf.direction = 'rtl'; buf.script = 'arab'; buf.language = 'ar'
    hb.shape(hfont, buf, {'kern': True, 'liga': True, 'rlig': True})
    assert all(i.codepoint != 0 for i in buf.glyph_infos)
    s, cursor, result = size/upem, x, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs, ntos=lambda v: format(v, '.2f').rstrip('0').rstrip('.'))
        glyphs[order[info.codepoint]].draw(TransformPen(pen, (s, 0, 0, -s, cursor+pos.x_offset*s, baseline-pos.y_offset*s)))
        result.append(pen.getCommands()); cursor += pos.x_advance*s
    evidence.append({'text':text,'glyphs':[order[i.codepoint] for i in buf.glyph_infos],'missingGlyphs':0,'direction':'rtl'})
    return ' '.join(result), cursor-x

def svg(w,h,body,title='منصتك التعليمية'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>'

# All major wordmark paths below are drawn here, not extracted from any font.
# Named letters make future optical corrections local and editable.
A = {
 'meem': 'M328 94C330 77 328 54 315 54C300 54 298 74 288 89L328 99M288 89Q285 99 273 99',
 'noon': 'M273 99Q259 99 259 83V70M259 83Q259 99 244 99',
 'sad': 'M244 99H230C240 65 222 49 199 54C180 58 170 80 158 99H219Q232 99 232 88',
 'taa': 'M158 99H149Q130 99 130 83V70M130 83Q130 99 114 99',
 'kaaf': 'M114 99Q99 99 99 83V26M99 83Q99 104 77 104H49C28 104 19 95 25 77',
 'kaaf-sign': 'M70 47L52 58Q48 62 57 62H65Q75 62 67 68L51 78',
}
B = {
 'meem': 'M337 84V65C337 49 329 41 317 41C301 41 292 50 292 66C292 81 302 87 317 87H337M317 87H283',
 'noon': 'M283 87Q267 87 267 73V61M267 73Q267 87 252 87',
 'sad': 'M252 87H238C247 60 236 45 219 45C197 45 183 63 169 87H227Q239 87 239 77',
 'taa': 'M169 87H158Q145 87 145 73V61M145 73Q145 87 130 87',
 'kaaf': 'M130 87Q113 87 113 71V23M113 71Q113 92 92 92H63C43 92 33 84 38 64',
 'kaaf-sign': 'M86 42L68 52Q63 56 73 56H80Q92 56 80 64L65 72',
}
C = {
 'meem': 'M285 92V77Q285 60 269 60Q254 60 254 77V86L285 96M254 86Q249 96 237 96',
 'noon': 'M237 96Q224 96 224 82V69M224 82Q224 96 211 96',
 'sad': 'M211 96H203C207 71 200 58 184 58C165 58 153 77 142 96H192Q205 96 205 86',
 'taa': 'M142 96H132Q120 96 120 82V69M120 82Q120 96 106 96',
 'kaaf': 'M106 96Q90 96 90 80V29M90 80Q90 100 73 100H47Q24 100 29 76',
 'kaaf-sign': 'M66 49L51 59Q47 63 55 63H62Q72 63 62 71L49 78',
}

def handcrafted(letters, weight, dots, color, shift=''):
    parts = ''.join(f'<path id="letter-{key}" d="{path}"/>' for key,path in letters.items())
    points = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="none"/>' for x,y,r in dots)
    return f'<g transform="{shift}" fill="none" stroke="{color}" stroke-width="{weight}" stroke-linecap="round" stroke-linejoin="round">{parts}{points}</g>'

def make_logo(concept,color):
    if concept=='A':
        word=handcrafted(A,10,[(259,49,5),(122,48,4.5),(138,48,4.5)],color,'translate(190 0)')
        p,w=outline('التعليمية',52,17,101)
        return word+f'<path id="licensed-descriptor" fill="{color}" d="{p}"/>',540,136
    if concept=='B':
        word=handcrafted(B,8,[(267,43,4),(138,43,3.8),(152,43,3.8)],color)
        p,w=outline('التعليمية',25,0,124)
        return word+f'<path id="licensed-descriptor" transform="translate({341-w} 0)" fill="{color}" d="{p}"/>',365,146
    word=handcrafted(C,8,[(224,49,4),(113,48,3.8),(127,48,3.8)],color,'translate(0 -5)')
    p,w=outline('التعليمية',25,0,133)
    emblem=system_symbol(color)
    return word+f'<path id="licensed-descriptor" transform="translate({290-w} 0)" fill="{color}" d="{p}"/><g transform="translate(327 41) scale(1.2)">{emblem}</g>',415,154

def system_symbol(color):
    # Three independent lanes converge into a shared completion/operations rail.
    return f'''<g id="learning-lanes" fill="none" stroke="{color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 12H31Q48 12 48 29V43Q48 53 58 53"/>
      <path d="M10 28H25Q36 28 36 39V43Q36 53 46 53H58"/>
      <path d="M10 44H18Q24 44 24 47Q24 53 31 53H58"/>
    </g>'''

def compact(concept,color):
    if concept=='A':
        return f'<g transform="translate(-117 -7) scale(.53)">{handcrafted({k:v for k,v in A.items() if k in ["meem","noon"]},10,[(259,49,5)],color)}</g>'
    if concept=='B':
        return f'<g fill="none" stroke="{color}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"><path d="M55 37V28C55 16 48 10 38 10C26 10 20 18 20 28C20 39 29 43 40 43H55M40 43H18Q9 43 9 53V58"/></g>'
    return system_symbol(color)

def main():
    for concept in ['A','B','C']:
        for theme,color in [('light','#193C39'),('dark','#F4F2E9'),('mono','#151515')]:
            body,w,h=make_logo(concept,color)
            (HERE/f'concept-{concept}-{theme}.svg').write_text(svg(w,h,body),encoding='utf8')
            (HERE/f'concept-{concept}-symbol-{theme}.svg').write_text(svg(64,64,compact(concept,color)),encoding='utf8')
    # This is a preparatory drawing sheet, not the presentation board.
    body='<rect width="1200" height="600" fill="#F4F2E9"/>'
    for i,k in enumerate(['A','B','C']):
        logo,w,h=make_logo(k,'#193C39')
        body+=f'<g transform="translate({i*400+20} 160) scale({360/w})">{logo}</g>'
        body+=f'<g transform="translate({i*400+180} 390)">{compact(k,"#193C39")}</g>'
    (HERE/'drawing-review.svg').write_text(svg(1200,600,body),encoding='utf8')
    presentation()
    unique={json.dumps(item,ensure_ascii=False):item for item in evidence}
    (HERE/'shaping-evidence.json').write_text(json.dumps(list(unique.values()),ensure_ascii=False,indent=2),encoding='utf8')

INK, PAPER, DARK, MUTED, RULE = '#193C39', '#F4F2E9', '#10302D', '#69736C', '#CDD0C5'
TITLES = {'A':'الاسم هو العلامة','B':'الميم المتصلة','C':'مسارات تلتقي'}
COPY = {
 'A':['حروف واسعة وإيقاع هادئ، يقدّمان الاسم قبل الرمز.', '«منصتك» مرسومة يدويًا؛ و«التعليمية» على السطر نفسه.', 'العلامة المختصرة مقتطف «من» من صلب الكتابة.'],
 'B':['رأس الميم هو نقطة البداية للكلمة وللرمز معًا.', 'حلقته المغلقة ومساره الراجع يبنيان حرفًا لا مضلعًا.', 'تركيب مكثّف؛ الوصف ثانوي، والرمز مستقل عند الحاجة.'],
 'C':['ثلاثة مسارات مستقلة تنتهي في قناة تشغيل واحدة.', 'استعارة للتعلّم والتقييم والشهادة داخل نظام مترابط.', 'الكتابة أضيق وأقرب إلى الإيقاع التقني المنظّم.'],
}

def label(text,size,right,baseline,color=INK):
    p,w=outline(text,size)
    return f'<path aria-label="{text}" fill="{color}" transform="translate({right-w} {baseline})" d="{p}"/>'

def paragraph(lines,right,baseline,width=490,size=23):
    result=''; y=baseline
    for sentence in lines:
        row=''
        for word in sentence.split():
            candidate=(row+' '+word).strip()
            if outline(candidate,size)[1]>width and row:
                result+=label(row,size,right,y,MUTED); y+=35; row=word
            else: row=candidate
        result+=label(row,size,right,y,MUTED); y+=35
    return result

def fitted_logo(k,color,x,y,maxw,maxh):
    body,w,h=make_logo(k,color); scale=min(maxw/w,maxh/h)
    return f'<g transform="translate({x+(maxw-w*scale)/2} {y+(maxh-h*scale)/2}) scale({scale})">{body}</g>'

def presentation():
    board=f'<rect width="1800" height="2040" fill="{PAPER}"/>'
    board+=label('منصتك التعليمية',36,1700,112)
    board+=label('ثلاثة مسارات. هوية واحدة.',60,1700,215)
    board+=label('مقارنة إبداعية — للاعتماد البصري فقط، وليست هوية معتمدة.',27,1700,283,MUTED)
    board+=f'<path d="M100 340H1700" fill="none" stroke="{RULE}"/>'
    for k,x in [('A',1200),('B',650),('C',100)]:
        board+=f'<text x="{x}" y="418" fill="{MUTED}" font-size="32" font-family="sans-serif">{k}</text>'
        board+=label(TITLES[k],32,x+500,418)
        board+=label('التكوين الأساسي · على أرضية فاتحة',20,x+500,478,MUTED)
        board+=fitted_logo(k,INK,x,508,500,175)
        board+=f'<rect x="{x}" y="738" width="500" height="245" fill="{DARK}"/>'
        board+=fitted_logo(k,PAPER,x+25,766,450,180)
        board+=label('رمز مختصر واختبار بالحجم الفعلي',22,x+500,1054)
        board+=f'<g transform="translate({x+393} 1090) scale(1.5)">{compact(k,INK)}</g>'
        for size,ix in [(32,270),(24,185),(16,105)]:
            board+=f'<g transform="translate({x+ix} 1120) scale({size/64})">{compact(k,INK)}</g>'
            board+=f'<text x="{x+ix+size/2}" y="1187" text-anchor="middle" font-family="sans-serif" fill="{MUTED}" font-size="18">{size} px</text>'
        board+=label('الاسم الكامل · ٢٤٠ / ١٦٠ بكسل',20,x+500,1255,MUTED)
        for width,y in [(240,1290),(160,1380)]:
            body,w,h=make_logo(k,INK)
            board+=f'<g transform="translate({x+500-width} {y}) scale({width/w})">{body}</g>'
        board+=f'<path d="M{x} 1480H{x+500}" fill="none" stroke="{RULE}"/>'
        board+=paragraph(COPY[k],x+500,1543)
    board+=f'<path d="M100 1785H1700" fill="none" stroke="{RULE}"/>'
    board+=label('أساس مشترك: أخضر حبر، وورق دافئ. المقارنة في الفكرة لا في اللون.',25,1700,1850)
    board+=label('«منصتك»: مسارات يدوية. «التعليمية»: آي بي إم بلكس، بترخيص الخطوط المفتوحة.',22,1700,1904,MUTED)
    board+=label('تُراجع القراءة والنقاط والأحجام الصغيرة قبل أي تركيب في المنتج.',22,1700,1948,MUTED)
    (HERE/'comparison-board.svg').write_text(svg(1800,2040,board,'ثلاثة مفاهيم لشعار منصتك التعليمية — عرض للاعتماد'),encoding='utf8')
    for k in ['A','B','C']:
        for theme,bg,fg in [('light',PAPER,INK),('dark',DARK,PAPER)]:
            body=f'<rect width="2000" height="1300" fill="{bg}"/>'
            body+=label(TITLES[k],38,1840,150,fg)
            body+=fitted_logo(k,fg,200,350,1600,440)
            body+=f'<g transform="translate(1560 950) scale(2)">{compact(k,fg)}</g>'
            body+=label('مقترح إبداعي — غير معتمد',25,1840,1210,fg)
            (HERE/f'concept-{k}-preview-{theme}.svg').write_text(svg(2000,1300,body),encoding='utf8')
    (HERE/'FONT-LICENSE.txt').write_text((FRONTEND/'node_modules/@fontsource/ibm-plex-sans-arabic/LICENSE').read_text(encoding='utf8'),encoding='utf8')

if __name__ == '__main__': main()
