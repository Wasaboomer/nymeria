#!/usr/bin/env python3
# Uso: python3 tools/crop-ritratti.py <immagine.png> <nome-popolo> [colonne=4] [righe=6]
# Taglia una tavola di ritratti (con o senza canali scuri tra i riquadri) in quadrati 256px WebP.
import sys,os
from PIL import Image
import numpy as np
src,nome=sys.argv[1],sys.argv[2];C=int(sys.argv[3]) if len(sys.argv)>3 else 4;R=int(sys.argv[4]) if len(sys.argv)>4 else 6
im=Image.open(src).convert('RGB');W,H=im.size
a=np.asarray(im.convert('L')).astype(float)
def cells(m,n,L):
    # cerca n celle: usa i canali piu scuri vicino ai confini teorici
    step=L/n;cuts=[0]
    for i in range(1,n):
        c=int(i*step);lo,hi=max(0,c-int(step*.08)),min(L-1,c+int(step*.08))
        seg=m[lo:hi+1];j=lo+int(np.argmin(seg));cuts.append(j)
    cuts.append(L);return cuts
cx=cells(a.mean(0),C,W);cy=cells(a.mean(1),R,H)
out=os.path.join(os.path.dirname(__file__),'..','client','assets','ritratti');os.makedirs(out,exist_ok=True)
n=0
for r in range(R):
    for c in range(C):
        x0,x1,y0,y1=cx[c],cx[c+1],cy[r],cy[r+1]
        m=int(min(x1-x0,y1-y0)*.04)+6  # taglia i bordi
        x0+=m;x1-=m;y0+=m;y1-=m;s=min(x1-x0,y1-y0);mx=(x0+x1)//2;my=(y0+y1)//2
        im.crop((mx-s//2,my-s//2,mx-s//2+s,my-s//2+s)).resize((256,256),Image.LANCZOS).save(f'{out}/{nome}-{n:02d}.webp',quality=84);n+=1
print(n,'ritratti')
