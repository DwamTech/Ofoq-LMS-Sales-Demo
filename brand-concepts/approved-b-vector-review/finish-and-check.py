"""Package exact browser-rendered favicon PNGs into ICO; verify vector exports."""
from pathlib import Path
import struct,json,hashlib,zipfile
import xml.etree.ElementTree as ET
from PIL import Image
HERE=Path(__file__).resolve().parent
checks=[]
def check(name,valid,details):checks.append({'name':name,'status':'PASS' if valid else 'FAIL','details':details})
sizes=[16,24,32,48,64,256]
frames=[(HERE/f'favicon-{s}.png').read_bytes() for s in sizes]
offset=6+16*len(frames); directory=[]
for size,frame in zip(sizes,frames):
    directory.append(struct.pack('<BBBBHHII',0 if size==256 else size,0 if size==256 else size,0,0,1,32,len(frame),offset));offset+=len(frame)
(HERE/'favicon-review.ico').write_bytes(struct.pack('<HHH',0,1,len(frames))+b''.join(directory)+b''.join(frames))
im=Image.open(HERE/'favicon-review.ico')
check('ICO has exact required native-size frames',im.ico.sizes()=={(s,s) for s in sizes},sorted(im.ico.sizes()))
for p in HERE.glob('mansatak-*.svg'):
    root=ET.fromstring(p.read_text(encoding='utf8'));tags=[e.tag.split('}')[-1] for e in root.iter()]
    ids=[e.get('id') for e in root.iter() if e.get('id')]
    check(p.name+': vector structure',root.get('aria-label')=='منصتك التعليمية' and 'path' in tags and not any(t in tags for t in ['image','text','script','foreignObject']) and len(ids)==len(set(ids)),{'paths':tags.count('path'),'duplicateIds':len(ids)-len(set(ids))})
for p in HERE.glob('mansatak-*@4x.png'):
    image=Image.open(p);bounds=image.getbbox();w,h=image.size
    check(p.name+': transparent valid export, no edge clipping',image.mode=='RGBA' and bounds and 0<bounds[0]<bounds[2]<w and 0<bounds[1]<bounds[3]<h,{'mode':image.mode,'size':image.size,'inkBounds':bounds})
for size in [16,24,32,48,64,180,192,256,512]:
    image=Image.open(HERE/f'favicon-{size}.png');check(f'favicon {size}px: native output',image.size==(size,size),{'size':image.size})
result={'pass':sum(c['status']=='PASS' for c in checks),'fail':sum(c['status']=='FAIL' for c in checks),'checks':checks}
(HERE/'artifact-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'pass':result['pass'],'fail':result['fail']}))
if result['fail']:raise SystemExit(1)
archive=HERE/'mansatak-approved-b-review.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in sorted(HERE.iterdir()):
        if f.is_file() and f.name not in [archive.name,'file-index.json'] and not f.name.startswith('type-study'):
            z.write(f,f.name)
index=[]
for f in sorted(HERE.iterdir()):
    if f.is_file() and f.name!='file-index.json':
        data=f.read_bytes();index.append({'filename':f.name,'path':f.as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
(HERE/'file-index.json').write_text(json.dumps({'root':HERE.as_posix(),'scope':'Review assets only; not installed in application','files':index},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'files':len(index),'reviewZipBytes':archive.stat().st_size}))
