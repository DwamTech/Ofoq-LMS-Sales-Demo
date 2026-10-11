"""Accurate binary export from Chrome-rendered vector artwork, no raster tracing."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
png = Image.open(ROOT/'public/brand/mansatak-app-512.png')
png.save(ROOT/'public/favicon.ico',format='ICO',sizes=[(16,16),(32,32),(48,48)])
png.save(ROOT/'assets/favicon.ico',format='ICO',sizes=[(16,16),(32,32),(48,48)])
png.save(ROOT/'assets/tab_icon.png')
logo = Image.open(ROOT/'public/brand/mansatak-primary-light@4x.png')
logo.save(ROOT/'assets/mahad_alofk2.png')
paper = Image.new('RGB',logo.size,'#F6F4ED');paper.paste(logo,mask=logo.getchannel('A'))
for name in ['public/mahad_alofk.jpg','assets/mahad_alofk.jpg']:paper.save(ROOT/name,quality=94)
print('PNG source aliases and actual 16/32/48 ICO frames generated.')
