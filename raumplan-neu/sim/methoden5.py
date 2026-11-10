# Vergleich der Messmethoden: Handy + Zollstock mit 2 Bodenblaettern (4 Marken 80 mm, 2000 x 155 mm)
import numpy as np, sys
rng=np.random.default_rng(7); SV=None; SK=.4; SO=.0005; K1=.004; RL=.0014; ZC=.002; RXS=None; PN=False; FERR=.01; B=1; HX=None
W,H=4000,3000; F0=0.77*W   # S25 Hauptkamera 12 MP, ca. 66 Grad
def layout(ms=0.08):
    C=[]; 
    for cx,cy in [(0,.070),(0,.225),(2,.070),(2,.225)]:
        for dx,dy in [(-1,-1),(1,-1),(1,1),(-1,1)]: C.append([cx+dx*ms/2,cy+dy*ms/2])
    return np.array(C)
L0=layout()
def look(c,t,roll=0):
    z=t-c; z=z/np.linalg.norm(z); x=np.cross(z,[0,0,1.]); x/=np.linalg.norm(x); y=np.cross(z,x)
    R=np.vstack([x,y,z]); cr,sr=np.cos(roll),np.sin(roll); return np.array([[cr,sr,0],[-sr,cr,0],[0,0,1]])@R
def proj(P,R,c,K,k1=0):
    X=(R@(P-c).T).T; z=X[:,2]; u=X[:,0]/z; v=X[:,1]/z
    if k1:
        r2=(u*u+v*v)/(0.625**2+.47**2); u=u*(1+k1*r2); v=v*(1+k1*r2)
    return np.c_[K[0,0]*u+K[0,2],K[1,1]*v+K[1,2]],z
def norm(p):
    m=p.mean(0); s=np.sqrt(2)/np.sqrt(((p-m)**2).sum(1)).mean(); return np.array([[s,0,-s*m[0]],[0,s,-s*m[1]],[0,0,1]])
def H_dlt(a,b):
    Ta,Tb=norm(a),norm(b); A=[]
    pa=(Ta@np.c_[a,np.ones(len(a))].T).T; pb=(Tb@np.c_[b,np.ones(len(b))].T).T
    for (x,y,_),(u,v,_) in zip(pa,pb):
        A.append([-x,-y,-1,0,0,0,u*x,u*y,u]); A.append([0,0,0,-x,-y,-1,v*x,v*y,v])
    h=np.linalg.svd(np.array(A))[2][-1].reshape(3,3); return np.linalg.inv(Tb)@h@Ta
def mapH(H,p):
    q=(H@np.c_[p,np.ones(len(p))].T).T; return q[:,:2]/q[:,2:]
def pnp_prior(img,obj,K,R_noisy,c0):
    # nur Position + Gierwinkel frei (Neigung aus Schwerkraft), Gauss-Newton
    th=0.; c=c0.copy(); P=np.c_[obj,np.zeros(len(obj))]
    def Rz(t): 
        cs,sn=np.cos(t),np.sin(t); return np.array([[cs,-sn,0],[sn,cs,0],[0,0,1]])
    for _ in range(12):
        def res(v):
            R=R_noisy@Rz(v[3]); return (proj(P,R,v[:3],K)[0]-img).ravel()
        v=np.r_[c,th]; r=res(v); J=np.zeros((len(r),4))
        for i in range(4):
            d=np.zeros(4); d[i]=1e-5; J[:,i]=(res(v+d)-r)/1e-5
        dv=np.linalg.lstsq(J,-r,rcond=None)[0]; c+=dv[:3]; th+=dv[3]
    return R_noisy@Rz(th),c
def ray_floor(px,R,c,K):
    d=np.c_[(px[:,0]-K[0,2])/K[0,0],(px[:,1]-K[1,2])/K[1,1],np.ones(len(px))]; d=(R.T@d.T).T
    return (c[None,:]+d*(-c[2]/d[:,2])[:,None])[:,:2]

def pnp6(img,obj,K,H0):
    Kin=np.linalg.inv(K); A=Kin@H0; l=(np.linalg.norm(A[:,0])+np.linalg.norm(A[:,1]))/2; A=A/l
    if A[2,2]<0: A=-A
    r1,r2,t=A[:,0],A[:,1],A[:,2]; r3=np.cross(r1,r2); U,_,V=np.linalg.svd(np.c_[r1,r2,r3]); R=U@V
    P=np.c_[obj,np.zeros(len(obj))]
    def rod(w):
        th=np.linalg.norm(w); 
        if th<1e-12: return np.eye(3)
        k=w/th; Kx=np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]]); return np.eye(3)+np.sin(th)*Kx+(1-np.cos(th))*Kx@Kx
    def res(v):
        Rn=rod(v[:3])@R; X=(Rn@P.T).T+v[3:]; u=K[0,0]*X[:,0]/X[:,2]+K[0,2]; vv=K[1,1]*X[:,1]/X[:,2]+K[1,2]; return (np.c_[u,vv]-img).ravel()
    v=np.r_[0,0,0,t]
    for _ in range(10):
        r=res(v); J=np.zeros((len(r),6))
        for i in range(6):
            d=np.zeros(6); d[i]=1e-6; J[:,i]=(res(v+d)-r)/1e-6
        v+=np.linalg.lstsq(J,-r,rcond=None)[0]
    Rn=rod(v[:3])@R; tt=v[3:]; return Rn, -Rn.T@tt
def trial(meth,sm,sc,fw=F0,WW=W,HH=H,ms=0.08,only2=False):
    F=fw; K=np.array([[F,0,WW/2],[0,F,HH/2],[0,0,1.]])
    L=rng.uniform(2.2,5.5); D=rng.uniform(2.5,6.0)   # Wand L, Raumtiefe D
    cs=np.array([[0,0],[L,0]],float)  # Wand auf y=0, Raum y>0; Ecken cs
    # Lage Zollstock
    if meth.startswith('wand'):
        if L<2.25: return None
        rx=(L/2-1+rng.normal(0,RXS)) if RXS is not None else rng.uniform(0.05,L-2.05); ry=rng.uniform(0.01,0.05); rth=rng.normal(0,np.radians(2))
    elif meth.startswith('mitte'):
        rx=L/2-1+rng.uniform(-.3,.3); ry=D/2+rng.uniform(-.3,.3); rth=rng.normal(0,np.radians(15))
    # Fehler Zollstock
    rlen=2.0+rng.uniform(-RL,RL+1e-12)
    Lt=L0*1.0; 
    if only2: Lt=Lt[:4].copy(); Lt=np.vstack([L0[:4],L0[8:12]])
    idx=np.arange(len(Lt))
    pts=Lt.copy(); 
    # Blaetter: Einzelverdrehung/Versatz
    for s in (0,1):
        sel=pts[:,0]<1 if s==0 else pts[:,0]>=1
        a=rng.normal(0,np.radians(SK)); ct=np.array([0 if s==0 else 2,.15])
        Rr=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]])
        pts[sel]=(Rr@(pts[sel]-ct).T).T+ct+rng.normal(0,SO+1e-12,2)
    pts[:,0]=pts[:,0]*rlen/2.0
    # Lage in Raumkoordinaten
    Rr=np.array([[np.cos(rth),-np.sin(rth)],[np.sin(rth),np.cos(rth)]]); w=(Rr@pts.T).T+[rx,ry]
    # Kamera
    h=rng.uniform(1.25,1.6)
    fit=0
    for tries in range(40):
        if meth in('wand','mitte','mitte+','wand_kn'):
            need=(L/2+.25)/(WW/2/F)            # Abstand damit Wand ins Bild passt
            d=need*rng.uniform(1.0,1.15); 
            if meth=='wand_kn': d=min(D-.3,need*rng.uniform(.9,1.1))
            c=np.array([L/2+rng.uniform(-.2,.2)*L,d,h])
        elif meth=='wand_ob':
            d=min(D-.3,rng.uniform(1.8,3.5)); c=np.array([rng.uniform(-.0,.25)*L,d,h])
        tgt=np.array([L/2,0,0.1+rng.uniform(-.05,.1)])
        R=look(c,tgt,rng.normal(0,np.radians(2)))
        P=np.c_[w,np.zeros(len(w))]; Q=np.c_[cs,np.zeros(2)]
        pm,zm=proj(P,R,c,K); pc,zc=proj(Q,R,c,K)
        ok=lambda p:(p[:,0]>40)&(p[:,0]<WW-40)&(p[:,1]>40)&(p[:,1]<HH-40)
        if ok(pm).all() and ok(pc).all() and d<D+1.0 and (zm>0).all(): fit=1;break
    if not fit: return 'nofit'
    # Rest-Verzeichnung
    k=rng.normal(0,K1+1e-12)
    pm=proj(P,R,c,K,k)[0]+rng.normal(0,sm,pm.shape); pc=proj(Q+np.array([0,0,rng.normal(0,ZC+1e-12)]),R,c,K,k)[0]; pc=pc+np.c_[rng.normal(0,sc,2),rng.normal(0,sc if SV is None else SV,2)+(rng.normal(0,SV)*np.ones(2) if SV else 0)]
    ref=Lt.copy()
    if meth=='mitte+':
        a=rng.normal(0,np.radians(.3),3); ax,ay=a[0],a[1]
        dR=np.array([[1,0,ay],[0,1,-ax],[-ay,ax,1]])
        # Referenz->Raum unbekannt: im Ruler-System rechnen
        RR=np.eye(3); RR[:2,:2]=Rr; Rw2r=R@RR  # Welt_ruler -> Kamera
        c_r=np.r_[Rr.T@(c[:2]-[rx,ry]),h]
        R2,c2=pnp_prior(pm,ref,K*np.array([[1+rng.normal(0,.003),1,1],[1,1+rng.normal(0,.003),1],[1,1,1]]),dR@Rw2r,c_r)
        q=ray_floor(pc,R2,c2,K)
    else:
        
        pm2=pm
        if B>1:
            pm2=pm+rng.normal(0,sm*(1/np.sqrt(B)-1) if False else 0,pm.shape)
        Hh=H_dlt(pm2,ref)
        if PN:
            Ke=K.copy(); Ke[0,0]*=1+rng.normal(0,FERR); Ke[1,1]=Ke[0,0]
            Rr2,c2=pnp6(pm2,ref,Ke,np.linalg.inv(Hh)); 
            q=ray_floor(pc,Rr2,c2,Ke)
        else: q=mapH(Hh,pc)
    m=np.linalg.norm(q[0]-q[1])
    return m-L, L, m

def run(meth,n=1500,**kw):
    E=[];NF=0;LL=[]
    for i in range(n):
        r=trial(meth,**kw)
        if r is None: continue
        if r=='nofit': NF+=1; continue
        E.append(r[0]);LL.append(r[1])
    E=np.abs(np.array(E))*1000
    if len(E)==0: return f'{meth:10s} keine Treffer'
    LL=np.array(LL); parts=' '.join(f'{a}-{a+1}m:{np.median(E[(LL>=a)&(LL<a+1)]):.0f}/{np.percentile(E[(LL>=a)&(LL<a+1)],90):.0f}' for a in (2,3,4,5) if ((LL>=a)&(LL<a+1)).sum()>5)
    return parts+' || '+f'{len(E):5d} ok {NF:5d} passt nicht | Median {np.median(E):6.1f} mm | 90% {np.percentile(E,90):6.1f} | 99% {np.percentile(E,99):6.1f} | Max {E.max():7.1f}'

import time
def set_(rxs=None,pn=False,ferr=.01):
    global RXS,PN,FERR; RXS,PN,FERR=rxs,pn,ferr
print('Fehler Wandlaenge mm: Laengenklasse median/90%')



def go(name,sm=.4,sc=1.5,sv=.7,n=500,G={},**cfg):
    global SV,SK,SO,K1,RL,ZC
    sv0=(SK,SO,K1,RL,ZC); 
    for k,v in G.items(): globals()[k]=v
    SV=sv; set_(**cfg); r=run(meth='wand',n=n,sm=sm,sc=sc); print(f'{name:44s}',r); SK,SO,K1,RL,ZC=sv0
off=dict(SK=0,SO=0,K1=0,RL=0,ZC=0)
go('alles 0 (Kontrolle)',sm=1e-4,sc=1e-4,sv=1e-4,rxs=.2,G=off)
go('nur Marken .4',sm=.4,sc=1e-4,sv=1e-4,rxs=.2,G=off)
go('nur Marken .15',sm=.15,sc=1e-4,sv=1e-4,rxs=.2,G=off)
go('nur Ecke u1.5 v.7',sm=1e-4,rxs=.2,G=off)
go('nur Blatt/Zollstock',sm=1e-4,sc=1e-4,sv=1e-4,rxs=.2,G=dict(K1=0,ZC=0))
go('nur Verzeichnung',sm=1e-4,sc=1e-4,sv=1e-4,rxs=.2,G=dict(SK=0,SO=0,RL=0,ZC=0))
go('nur Marken .4, f bekannt',sm=.4,sc=1e-4,sv=1e-4,rxs=.2,pn=True,ferr=.003,G=off)
go('nur Marken .15, f bekannt',sm=.15,sc=1e-4,sv=1e-4,rxs=.2,pn=True,ferr=.003,G=off)
