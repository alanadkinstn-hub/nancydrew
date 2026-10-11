import os; os.chdir('/workspace/nancydrew')
from PIL import Image, ImageDraw, ImageFont
NAVY=(27,47,94); GOLD=(217,165,33); CREAM=(246,239,220)
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
def icon(size, path, maskable=False):
    S=size*4
    im=Image.new('RGB',(S,S),NAVY); d=ImageDraw.Draw(im)
    pad = int(S*0.10) if maskable else int(S*0.06)
    # gold double frame
    d.rectangle([pad,pad,S-pad,S-pad],outline=GOLD,width=int(S*0.025))
    p2=pad+int(S*0.045); d.rectangle([p2,p2,S-p2,S-p2],outline=GOLD,width=int(S*0.008))
    f=ImageFont.truetype(font_path,int(S*0.40))
    t='ND'; bb=d.textbbox((0,0),t,font=f); w=bb[2]-bb[0]; h=bb[3]-bb[1]
    d.text(((S-w)/2-bb[0],(S-h)/2-bb[1]-S*0.05),t,font=f,fill=CREAM)
    # magnifying glass under text
    cx,cy,r=S*0.44,S*0.74,S*0.07
    d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=GOLD,width=int(S*0.022))
    d.line([cx+r*0.7,cy+r*0.7,cx+r*2.2,cy+r*2.0],fill=GOLD,width=int(S*0.03))
    d.line([S*0.55,S*0.74,S*0.66,S*0.74],fill=GOLD,width=int(S*0.012))
    im.resize((size,size),Image.LANCZOS).save(path)
icon(512,'icon-512.png'); icon(192,'icon-192.png'); icon(180,'apple-touch-icon.png'); icon(512,'icon-maskable-512.png',True)
