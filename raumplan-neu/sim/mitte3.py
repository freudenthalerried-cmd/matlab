# Zollstock bleibt in der Raummitte: welcher Fotoablauf ist genau genug?
import numpy as np
exec(open('methoden5.py',encoding='utf8').read().split("def trial(")[0].replace("print(",'pass;(') )
rng=np.random.default_rng(11); K1S=.004
W,H=4000,3000; F=0.77*W; K0=np.array([[F,0,W/2],[0,F,H/2],[0,0,1.]])
def photo(c,tgt,K,w,Q,sm,su,sv,fest,k1):
    R=look(c,tgt,rng.normal(0,np.radians(2)))
    P=np.c_[w,np.zeros(len(w))]; pm,zm=proj(P,R,c,K,k1); pc,zc=proj(np.c_[Q,rng.normal(0,.002,len(Q))],R,c,K,k1)
    ok=lambda p,z:(z>0.3)&(p[:,0]>30)&(p[:,0]<W-30)&(p[:,1]>30)&(p[:,1]<H-30)
    if not ok(pm,zm).all(): return None
    pm=pm+rng.normal(0,sm,pm.shape); vis=ok(pc,zc); pc=pc+np.c_[rng.normal(0,su,len(pc)),rng.normal(0,sv,len(pc))]
    return pm,pc,vis
def est(pm,pc,vis,ref,fe):
    Hh=H_dlt(pm,ref)
    if fe is None: return mapH(Hh,pc)
    Ke=np.array([[fe,0,W/2],[0,fe,H/2],[0,0,1.]]); Rp,cp=pnp6(pm,ref,Ke,np.linalg.inv(Hh)); return ray_floor(pc,Rp,cp,Ke)
def rooms(plan,sm=.4,su=3,sv=3,ferr=None,n=300):
    Err=[];fail=0;cov=[]
    for _ in range(n):
        Lx=rng.uniform(3,5.5);Ly=rng.uniform(2.8,5.0);Q=np.array([[0,0],[Lx,0],[Lx,Ly],[0,Ly]],float)
        th=rng.normal(0,np.radians(25));Rr=np.array([[np.cos(th),-np.sin(th)],[np.sin(th),np.cos(th)]])
        pts=L0.copy();pts[:,0]*=(2+rng.uniform(-.0014,.0014))/2
        for s in (0,1):
            sel=pts[:,0]<1 if s==0 else pts[:,0]>=1;a=rng.normal(0,np.radians(.4));ct=np.array([0 if s==0 else 2,.15]);Rs=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]]);pts[sel]=(Rs@(pts[sel]-ct).T).T+ct+rng.normal(0,.0005,2)
        cen=np.array([Lx/2,Ly/2])+rng.normal(0,.2,2);w=(Rr@(pts-np.array([1,.15])).T).T+cen
        k1=rng.normal(0,K1S); cams=plan(Lx,Ly,cen,Q)
        obs=[[] for _ in range(4)]
        for c,t,wantc in cams:
            r=photo(np.array([c[0],c[1],rng.uniform(1.25,1.6)]),np.array([t[0],t[1],0.]),K0,w,Q,sm,su,sv,None,k1)
            if r is None: continue
            pm,pc,vis=r; fe=None if ferr is None else F*(1+rng.normal(0,ferr)); q=est(pm,pc,vis,L0,fe)
            # zurueck ins Raumsystem (nur fuer Vergleich: Abstaende bleiben gleich)
            for i in range(4):
                if vis[i] and i in wantc: obs[i].append(q[i])
        if any(len(o)==0 for o in obs): fail+=1; continue
        cov.append(np.mean([len(o) for o in obs]))
        C=np.array([np.median(np.array(o),axis=0) for o in obs])
        for i in range(4):
            j=(i+1)%4; Err.append(abs(np.linalg.norm(C[i]-C[j])-np.linalg.norm(Q[i]-Q[j]))*1000)
    E=np.array(Err); return f'Median {np.median(E):5.1f} | 90% {np.percentile(E,90):5.1f} | 99% {np.percentile(E,99):6.1f} mm | geht in {100*(1-fail/n):.0f}% der Raeume, Fotos je Ecke {np.mean(cov) if cov else 0:.1f}'
# Fotoplaene
def walls(Lx,Ly,cen,Q):  # 4 Fotos: von jeder Wandmitte quer ueber den Zollstock auf die Gegenwand, 2 Ecken
    m=.25;o=[]
    for (c,t,w) in [((Lx/2,Ly-m),(Lx/2,0.1),(0,1)),((m,Ly/2),(Lx-.1,Ly/2),(1,2)),((Lx/2,m),(Lx/2,Ly-.1),(2,3)),((Lx-m,Ly/2),(.1,Ly/2),(3,0))]: o.append((c,t,w))
    return o
def corners(Lx,Ly,cen,Q): # 4 Fotos: aus jeder Ecke diagonal ueber den Zollstock in die Gegenecke
    m=.25;C=[(m,m),(Lx-m,m),(Lx-m,Ly-m),(m,Ly-m)];return [(C[(i+2)%4],Q[i]*.92+np.array(cen)*.08,(i,)) for i in range(4)]
def both(Lx,Ly,cen,Q): return walls(Lx,Ly,cen,Q)+corners(Lx,Ly,cen,Q)

def perCorner(nv):
    def plan(Lx,Ly,cen,Q):
        m=.25;o=[]
        for i in range(4):
            v=np.array(cen)-Q[i]; v/=np.linalg.norm(v)
            ang=[0,.45,-.45][:nv]
            for a in ang:
                u=np.array([v[0]*np.cos(a)-v[1]*np.sin(a),v[0]*np.sin(a)+v[1]*np.cos(a)])
                # so weit zurueck wie der Raum zulaesst, mindestens 1.7 m hinter dem Zollstock
                best=None
                for t in np.arange(4.5,1.2,-.1):
                    c=np.array(cen)+u*t
                    if m<c[0]<Lx-m and m<c[1]<Ly-m: best=c;break
                if best is None: continue
                tgt=(np.array(cen)+Q[i])/2
                o.append((best,tgt,(i,)))
        return o
    return plan

def setlens(fx,k):
    global F,K0,K1S; F=fx*W; K0=np.array([[F,0,W/2],[0,F,H/2],[0,0,1.]]); K1S=k
for nm,fx,k,kw,pl in [
 ('1x Haupt: 8 Fotos, Einrasten',.77,.004,dict(sm=.4,su=1.5,sv=1.5),perCorner(2)),
 ('0,6x Weitwinkel: 4 Fotos, Einrasten',.33,.02,dict(sm=.6,su=1.5,sv=1.5),perCorner(1)),
 ('0,6x Weitwinkel: 8 Fotos, Einrasten',.33,.02,dict(sm=.6,su=1.5,sv=1.5),perCorner(2)),
 ('0,6x Weitwinkel: 8 Fotos, Verzeichnung klein',.33,.006,dict(sm=.6,su=1.5,sv=1.5),perCorner(2)),
 ('0,6x: von den 4 Wandmitten',.33,.02,dict(sm=.6,su=1.5,sv=1.5),walls),
]:
    setlens(fx,k); print(f'{nm:46s}',rooms(pl,n=200,**kw))
