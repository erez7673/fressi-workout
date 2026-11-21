import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; files = sorted(glob.glob(os.path.join(d, '*.img')))
W = 260; cols = 5
rows = (len(files) + cols - 1) // cols
for part in range(0, len(files), 25):
    chunk = files[part:part+25]; r = (len(chunk)+cols-1)//cols
    sheet = Image.new('RGB', (cols*W, r*(W+22)), 'white'); dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        im = Image.open(f).convert('RGBA'); bg = Image.new('RGBA', im.size, 'white'); bg.alpha_composite(im); im = bg.convert('RGB')
        im.thumbnail((W-6, W-6)); x, y = (i%cols)*W, (i//cols)*(W+22)
        sheet.paste(im, (x+3+(W-6-im.width)//2, y+3+(W-6-im.height)//2))
        dr.text((x+4, y+W+4), os.path.basename(f)[:-4], fill='black')
    sheet.save(f'sheet{part//25+1}.png')
print('ok')
