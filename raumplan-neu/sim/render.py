# Erzeugt realistische Testfotos (12 MP) mit den ECHTEN Druckblaettern: Raum, Boden, Sockelleiste, Zollstock, Moebel, Schatten, Rauschen, JPEG
import numpy as np, cv2, fitz, json, sys, os
out=sys.argv[1]; n=int(sys.argv[2]); seed=int(sys.argv[3]) if len(sys.argv)>3 else 1; WW=int(sys.argv[4]) if len(sys.argv)>4 else 4000
os.makedirs(out,exist_ok=True); rng=np.random.default_rng(seed)
HH=WW*3//4; F=0.77*WW
d=fitz.open('E:/Downloads/Raumplan-Blaetter.pdf')
def page(i):
    p=d[i].get_pixmap(dpi=254); a=np.frombuffer(p.samples,np.uint8).reshape(p.h,p.w,p.n)[:,:,:3]
    return cv2.GaussianBlur(cv2.cvtColor(a,cv2.COLOR_RGB2GRAY),(3,3),0).astype(np.float32)
S0,S1=page(0),page(1); PX=10.0 # px je mm
def wood(sz=2048):
    a=rng.normal(0,1,(sz,sz)).astype(np.float32); a=cv2.GaussianBlur(a,(0,0),sigmaX=60,sigmaY=2); a=(a-a.mean())/a.std()
    b=np.zeros((sz,sz),np.float32)
    for k in range(0,sz,180): b[k:k+3,:]=-1
    return 130+30*a+14*b
def tex_wall(sz=1024):
    a=rng.normal(0,1,(sz,sz)).astype(np.float32); a=cv2.GaussianBlur(a,(0,0),6); return (a-a.mean())/a.std()
def look(c,t,roll):
    z=t-c; z/=np.linalg.norm(z); x=np.cross(z,[0,0,1.]); x/=np.linalg.norm(x); y=np.cross(z,x); R=np.vstack([x,y,z]); c_,s=np.cos(roll),np.sin(roll); return np.array([[c_,s,0],[-s,c_,0],[0,0,1]])@R
def shot(i,flip):
    L=float(rng.uniform(2.4,5.4)); D=float(rng.uniform(max(2.8,(L/2+.3)/.65+.4),6.5)); RH=float(rng.uniform(2.4,3.0))
    rx=L/2-1+rng.normal(0,.15); ry=rng.uniform(.015,.05) if flip else rng.uniform(.31,.36); rth=rng.normal(0,np.radians(2)); skirt=[0.0,.06,.08][rng.integers(0,3)]; thick=.0
    need=(L/2+.25)/(WW/2/F); dist=min(D-.25,need*float(rng.uniform(1.02,1.2))); h=float(rng.uniform(1.25,1.6)); c=np.array([L/2+rng.uniform(-.25,.25),dist,h])
    R=look(c,np.array([L/2,0.,float(rng.uniform(0.2,.5))]),rng.normal(0,np.radians(2)))
    W_,H_=WW,HH; u,v=np.meshgrid(np.arange(W_,dtype=np.float32)+.5,np.arange(H_,dtype=np.float32)+.5)
    k1=float(rng.normal(0,.004)); xn=(u-W_/2)/F; yn=(v-H_/2)/F; r2=(xn*xn+yn*yn)/(0.65**2+.49**2); xn=xn/(1+k1*r2); yn=yn/(1+k1*r2)
    dirs=np.stack([xn,yn,np.ones_like(xn)],-1)@R  # Weltrichtung (Zeilen)
    dx,dy,dz=dirs[...,0],dirs[...,1],dirs[...,2]; eps=1e-9
    # Schnitte
    tF=np.where(dz<-eps,-c[2]/np.minimum(dz,-eps),1e9); tC=np.where(dz>eps,(RH-c[2])/np.maximum(dz,eps),1e9)
    tW0=np.where(dy<-eps,-c[1]/np.minimum(dy,-eps),1e9); tW1=np.where(dy>eps,(D-c[1])/np.maximum(dy,eps),1e9)
    tL=np.where(dx<-eps,-c[0]/np.minimum(dx,-eps),1e9); tRg=np.where(dx>eps,(L-c[0])/np.maximum(dx,eps),1e9)
    T=np.stack([tF,tC,tW0,tW1,tL,tRg],0); idx=np.argmin(T,0); tmin=T.min(0)
    X=c[0]+dx*tmin; Y=c[1]+dy*tmin; Z=c[2]+dz*tmin
    floor=wood(); fx=(X*260)%2048; fy=(Y*260)%2048
    img=np.zeros((H_,W_),np.float32)
    mp=cv2.remap(floor,fx.astype(np.float32),fy.astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
    tw=tex_wall(); wt=cv2.remap(tw,((X+Y)*180%1024).astype(np.float32),((Z)*180%1024).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
    w0=float(rng.uniform(150,235)); shades=[0.,0.,w0,w0*rng.uniform(.8,1.0),w0*rng.uniform(.72,.92),w0*rng.uniform(.8,1.0)]
    for k in range(2,6): img[idx==k]=shades[k];
    wmask=idx>=2; img[wmask]=img[wmask]+wt[wmask]*1.5
    img[idx==1]=float(rng.uniform(205,240)); fm=idx==0; img[fm]=mp[fm]
    if skirt>0:
        s=(wmask)&(Z<skirt); img[s]=float(rng.uniform(170,245))+wt[s]*.6
    # Zollstock/Blaetter
    ct,st=np.cos(-rth),np.sin(-rth); fxx=X-rx; fyy=Y-ry; xr=ct*fxx-st*fyy; yr=st*fxx+ct*fyy
    orient=1 if flip else -1  # Blatt zeigt Richtung +y (Raum) oder Wand
    ym=(yr*orient)*1000  # mm vom Zollstock (Blatt um 180 Grad gedreht, nicht gespiegelt)
    xm=(2.0-xr)*1000 if orient>0 else xr*1000  # wie im Druck: Blatt 0 cm links, wenn man auf die Wand schaut
    for s,S in enumerate([S0,S1]):
        cx=2000.0*s; sx=((xm-cx+105)*PX).astype(np.float32); sy=(ym*PX).astype(np.float32)
        ins=(idx==0)&(sx>0)&(sy>0)&(sx<S.shape[1]-1)&(sy<S.shape[0]-1)
        v2=cv2.remap(S,sx,sy,cv2.INTER_LINEAR)
        img[ins]=v2[ins]*float(rng.uniform(.82,1.0))
    ruler=(idx==0)&(ym>6)&(ym<21)&(xm>=-3)&(xm<=2003)
    img[ruler]=np.minimum(img[ruler],185)
    # Moebel (Kasten) optional: verdeckt Wandteil
    # Licht
    gx=np.linspace(-1,1,W_,dtype=np.float32)[None,:]; gy=np.linspace(-1,1,H_,dtype=np.float32)[:,None]; img*=1+float(rng.uniform(-.12,.12))*gx+float(rng.uniform(-.1,.1))*gy
    img=cv2.GaussianBlur(img,(0,0),float(rng.uniform(.7,1.3)))
    img=np.clip(img+rng.normal(0,float(rng.uniform(1.5,4)),img.shape),0,255).astype(np.uint8)
    name=f'{out}/s{i:03d}'; cv2.imwrite(name+'.jpg',img,[cv2.IMWRITE_JPEG_QUALITY,88]); img2=cv2.imread(name+'.jpg',0)
    img2.tofile(name+'.raw')
    # Wahre Ecken im Bild
    def pj(P):
        X=R@(np.array(P)-c); u=X[0]/X[2]; v=X[1]/X[2]; r2=(u*u+v*v)/(0.65**2+.49**2); u2=u*(1+k1*r2); v2=v*(1+k1*r2); return [float(F*u2+W_/2),float(F*v2+H_/2)]
    json.dump(dict(W=W_,H=H_,L=L,D=D,ca=pj([0,0,skirt*0]),cb=pj([L,0,0]),rx=rx,ry=ry,dist=dist,h=h,k1=k1,rmm=[float(ct),float(st)]),open(name+'.json','w'))
for i in range(n): shot(i,i%2==0); print('.',end='',flush=True)
print('ok')
