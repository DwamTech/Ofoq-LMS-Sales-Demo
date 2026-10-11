"""Approved reference reconstruction. All outputs remain in this review folder.
No raster tracing, no image embedding, no application edits.
"""
from pathlib import Path
from io import BytesIO
import json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.merge import Merger

HERE=Path(__file__).resolve().parent
FRONTEND=HERE.parents[1]/'ofuq-frontend-main/ofuq-frontend-main'
NAME='منصتك التعليمية'
INK='#29233B'; PURPLE='#7B61D9'; LIME='#C8F263'; PAPER='#F6F4ED'
evidence=[]

def outline(text,size,weight=700,x=0,baseline=0,family='plex',refine=False):
    if family=='alexandria':
        f=instantiateVariableFont(TTFont(FRONTEND/'node_modules/@fontsource-variable/alexandria/files/alexandria-arabic-wght-normal.woff2'),{'wght':weight},inplace=False)
    elif family=='cairo':
        f=TTFont(HERE.parents[1]/'Ofoq_LMS_Backend_Main-main/Ofoq_LMS_Backend_Main-main/public/fonts/Cairo-Bold.ttf')
        if 'fvar' in f: f=instantiateVariableFont(f,{'wght':weight},inplace=False)
    else:
        base=FRONTEND/'node_modules/@fontsource/ibm-plex-sans-arabic/files'
        f=Merger().merge([str(base/f'ibm-plex-sans-arabic-arabic-{weight}-normal.woff2'),str(base/f'ibm-plex-sans-arabic-latin-{weight}-normal.woff2')])
    f.flavor=None; binary=BytesIO(); f.save(binary)
    hf=hb.Font(hb.Face(binary.getvalue())); upem=f['head'].unitsPerEm; hf.scale=(upem,upem)
    buf=hb.Buffer(); buf.add_str(text); buf.direction='rtl'; buf.script='arab'; buf.language='ar'
    hb.shape(hf,buf,{'kern':True,'liga':True,'rlig':True})
    assert all(i.codepoint!=0 for i in buf.glyph_infos)
    gs=f.getGlyphSet(); order=f.getGlyphOrder(); s=size/upem; cursor=x; paths=[]
    for info,pos in zip(buf.glyph_infos,buf.glyph_positions):
        pen=SVGPathPen(gs,ntos=lambda v:format(v,'.2f').rstrip('0').rstrip('.'))
        transform=TransformPen(pen,(s,0,0,-s,cursor+pos.x_offset*s,baseline-pos.y_offset*s))
        if refine and order[info.codepoint]=='uniFEE3':
            # Rounded initial meem: same advance, joining points and glyph frame.
            # Clockwise outer contour, opposite inner counter; no text stretching.
            parse_path('M-30 0V150H10Q49 150 62 190L85 280C113 382 179 432 285 432C404 432 482 345 482 216C482 72 449 -20 354 -20C280 -20 225 16 180 56C156 18 123 0 82 0Z M261 166C269 143 289 127 318 127C351 127 373 156 373 209C373 269 351 304 308 304C275 304 252 275 250 230C247 205 251 184 261 166Z',transform)
        else: gs[order[info.codepoint]].draw(transform)
        paths.append(pen.getCommands()); cursor+=pos.x_advance*s
    evidence.append({'text':text,'family':family,'weight':weight,'size':size,'width':cursor-x,'glyphs':[order[i.codepoint] for i in buf.glyph_infos],'missingGlyphs':0,'direction':'rtl','customInitialMeem':refine})
    return ' '.join(paths),cursor-x

def svg(w,h,body,title=NAME):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>'

def main():
    b=f'<rect width="1000" height="970" fill="{PAPER}"/>'
    for row,(family,wt) in enumerate([('alexandria',750),('plex',700),('cairo',700)]):
        p,w=outline('منصتك',100,wt,40,160+row*300,family)
        q,z=outline('التعليمية',90,700 if family=='plex' else 600,40,270+row*300,family)
        b+=f'<path fill="{INK}" d="{p} {q}"/>'
    (HERE/'type-study.svg').write_text(svg(1000,970,b),encoding='utf8')
    for theme in ['light','dark','mono','mono-white']:
        for layout in ['horizontal','stacked','icon']:
            body,w,h=logo(layout,theme,f'{layout}-{theme}')
            (HERE/f'mansatak-{layout}-{theme}.svg').write_text(svg(w,h,body),encoding='utf8')
    (HERE/'editable-symbol-source.svg').write_text(svg(224,224,symbol('light','editable','translate(12 12)')),encoding='utf8')
    (HERE/'FONT-LICENSE.txt').write_text((FRONTEND/'node_modules/@fontsource/ibm-plex-sans-arabic/LICENSE').read_text(encoding='utf8'),encoding='utf8')
    board()
    unique={json.dumps(i,ensure_ascii=False):i for i in evidence}
    (HERE/'shaping-evidence.json').write_text(json.dumps(list(unique.values()),ensure_ascii=False,indent=2),encoding='utf8')

# Manually reconstructed cubic geometry. Source coordinates refer to a 200-unit
# symbol, not pixels sampled/traced from the reference. Separate ribbon layers
# retain the approved overlap and are editable independently.
GEOMETRY={
 'right-leg':'M160 121C171 107 187 94 199 92V179C199 206 160 206 160 179Z',
 'right-ribbon':'M94 112L149 69C161 59 173 58 185 69Q197 81 199 92C187 94 171 107 160 121L100 160C112 143 108 125 94 112Z',
 'left-leg':'M0 108C16 99 32 103 40 121V169C40 188 26 199 0 199Z',
 'left-ribbon':'M0 108C0 94 10 80 20 71C28 64 35 62 46 70L99 111C110 120 115 140 109 151C105 165 94 166 83 157L40 122C23 108 14 104 0 108Z',
 'diamond':'M89 3C94 -1 100 -1 106 3L143 32C151 38 151 44 144 50L106 79C101 84 96 84 90 80L52 50C45 44 45 39 52 33Z',
}

def symbol(theme,prefix,transform=''):
    dark=theme=='dark'; mono=theme.startswith('mono'); solid='#FFFFFF' if theme=='mono-white' else '#000000'
    colors={
     'left-leg':('#E9E6F7','#FFFFFF') if dark else ('#352147','#190D2C'),
     'left-ribbon':('#FFFFFF','#E9E6F7') if dark else ('#362448','#201330'),
     'right-leg':('#A487EF','#7454C7') if dark else ('#7D5BC6','#6243A2'),
     'right-ribbon':('#A58AEF','#7B61D9') if dark else ('#9170DE','#7B61D9'),
     'diamond':('#C8F263','#BEE858'),
    }
    defs=''; body=''
    for key,path in GEOMETRY.items():
        gid=f'{prefix}-{key}'
        if not mono:
            a,b=colors[key]; defs+=f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'
        body+=f'<path id="{prefix}-shape-{key}" fill="{solid if mono else "url(#"+gid+")"}" d="{path}"/>'
    return f'<defs>{defs}</defs><g id="{prefix}-symbol" transform="{transform}">{body}</g>'

def wordmark(theme,prefix,x=0,y=0,scale=1):
    color='#FFFFFF' if theme in ['dark','mono-white'] else '#000000' if theme=='mono' else INK
    first,w1=outline('منصتك',108,700,0,100,'plex',True)
    second,w2=outline('التعليمية',96,600,0,192,'plex')
    width=max(w1,w2)
    return f'<g id="{prefix}-arabic-wordmark" fill="{color}" transform="translate({x} {y}) scale({scale})"><path id="{prefix}-mansatak" transform="translate({width-w1} 0)" d="{first}"/><path id="{prefix}-educational" transform="translate({width-w2} 0)" d="{second}"/></g>',width

def logo(layout,theme,prefix):
    if layout=='icon': return symbol(theme,prefix,'translate(12 12)'),224,224
    if layout=='horizontal':
        word,w=wordmark(theme,prefix,20,12)
        return word+symbol(theme,prefix,'translate(370 16)'),600,232
    word,w=wordmark(theme,prefix,20,209)
    return symbol(theme,prefix,'translate(88 12)')+word,372,436

def label(text,size,right,baseline,color=INK):
    p,w=outline(text,size,600)
    return f'<path fill="{color}" transform="translate({right-w} {baseline})" d="{p}"/>'

def fit(layout,theme,prefix,x,y,width,height):
    body,w,h=logo(layout,theme,prefix); s=min(width/w,height/h)
    return f'<g transform="translate({x+(width-w*s)/2} {y+(height-h*s)/2}) scale({s})">{body}</g>'

def favicon(size):
    body=f'<rect width="256" height="256" rx="55" fill="{INK}"/>'+symbol('dark','favicon-'+str(size),'translate(38 26) scale(.90)')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 256 256" role="img" aria-label="{NAME}"><title>{NAME}</title>{body}</svg>'

def board():
    b=f'<rect width="1800" height="1800" fill="{PAPER}"/>'
    b+=label(NAME,42,1680,100)
    b+=label('إعادة بناء الاتجاه المعتمد — مراجعة الأصول المتجهية',28,1680,162,'#686074')
    b+='<path d="M120 205H1680" stroke="#DAD5E3"/>'
    b+=label('الشعار الرئيسي',26,1680,259)
    b+=fit('horizontal','light','hero',750,280,920,365)
    b+=label('التركيب المكدّس',26,610,259)
    b+=fit('stacked','light','stack',180,280,390,365)
    b+='<path d="M120 690H1680" stroke="#DAD5E3"/>'
    for theme,x,name in [('light',120,'خلفية فاتحة'),('dark',660,'خلفية داكنة'),('mono',1200,'أحادي اللون')]:
        b+=label(name,25,x+480,746)
        b+=f'<rect x="{x}" y="780" width="480" height="255" rx="18" fill="{INK if theme=="dark" else "#FFFFFF"}"/>'
        b+=fit('horizontal',theme,'board-'+theme,x+22,813,436,185)
    b+=label('الأيقونة بأحجام فعلية — للاستخدام المصغّر',26,1680,1110)
    for i,size in enumerate([64,48,32,24,16]):
        x=1480-i*150
        b+=f'<g transform="translate({x} 1150)">{favicon(size).replace("<svg ","<svg x=\"0\" y=\"0\" ",1)}</g>'
        b+=f'<text x="{x+size/2}" y="1245" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#686074">{size}px</text>'
    b+=fit('icon','light','large-icon',150,1100,245,245)
    b+='<path d="M120 1350H1680" stroke="#DAD5E3"/>'
    b+=label('البنفسجي والأخضر المعتمدان — دون ظل نقطي أو صورة مضمنة',26,1680,1414)
    for i,(color,caption) in enumerate([(INK,'حبر داكن'),(PURPLE,'بنفسجي'),(LIME,'أخضر ليموني'),(PAPER,'عاجي')]):
        x=1360-i*305
        b+=f'<rect x="{x}" y="1450" width="240" height="100" rx="12" fill="{color}" stroke="#DAD5E3"/>'
        b+=label(caption,21,x+240,1595)
        b+=f'<text x="{x+240}" y="1636" text-anchor="end" font-family="sans-serif" font-size="20" fill="#686074">{color}</text>'
    b+=label('ملفات مستقلة للاعتماد البشري؛ لم تُركّب في التطبيق',26,1680,1727)
    (HERE/'comparison-board.svg').write_text(svg(1800,1800,b,'منصتك التعليمية — لوحة مراجعة إعادة البناء'),encoding='utf8')
    for theme in ['light','dark']:
        body=f'<rect width="2000" height="1000" fill="{INK if theme=="dark" else PAPER}"/>'
        body+=fit('horizontal',theme,'preview-'+theme,180,170,1640,620)
        (HERE/f'preview-{theme}.svg').write_text(svg(2000,1000,body),encoding='utf8')
    for size in [16,24,32,48,64,180,192,256,512]:
        (HERE/f'favicon-{size}.svg').write_text(favicon(size),encoding='utf8')

if __name__=='__main__':main()
