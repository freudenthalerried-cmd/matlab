"""Simulation Photogrammetrie: Video -> Zielmarken 3D (Bündelausgleich, Selbstkalibrierung) -> Wandebenen -> Raummaße.
Maßstab: 2 Zielmarken auf Maßband-Marken 0 / 3,00 m am Boden (Lagefehler ±0,5 mm)."""
import numpy as np, sys
from scipy.optimize import least_squares
from scipy.sparse import lil_matrix
from scipy.spatial.transform import Rotation as Rot
rng = np.random.default_rng(int(sys.argv[1]) if len(sys.argv) > 1 else 0)
L, B, H = 4.2, 3.6, 2.6
W_IMG, H_IMG = 3840, 2160; F_TRUE = 2900.; K1, K2 = 0.03, -0.01

def targets(per_wall=3):
    T, wall = [], []
    walls = [((0,0),(L,0)),((L,0),(L,B)),((L,B),(0,B)),((0,B),(0,0))]
    for w,(a,b) in enumerate(walls):
        a,b = np.array(a,float),np.array(b,float)
        for k in range(per_wall):
            t = 0.2 + 0.6*k/(max(per_wall-1,1)); z = [1.0,1.8,1.3,0.6][k%4]
            p = a+(b-a)*t; T.append([p[0],p[1],z]); wall.append(w)
    # Boden: Maßband-Marken (Maßstab) + 2 weitere
    T += [[0.8,1.2,0],[3.8,1.2,0],[1.5,2.6,0],[3.0,0.6,0]]; wall += [-1,-2,-3,-3]
    return np.array(T), np.array(wall)

def project(P, cam, intr):
    r = Rot.from_rotvec(cam[:3]); Pc = r.apply(P) + cam[3:6]
    x, y = Pc[:,0]/Pc[:,2], Pc[:,1]/Pc[:,2]; r2 = x*x+y*y; d = 1+intr[1]*r2+intr[2]*r2*r2
    return np.c_[intr[0]*x*d + intr[3], intr[0]*y*d + intr[4]], Pc[:,2]

def look(C, tgt):
    z = tgt-C; z/=np.linalg.norm(z); x = np.cross(z,[0,0,1]); x/=np.linalg.norm(x); y = np.cross(z,x)
    R = np.stack([x,y,z]); return np.r_[Rot.from_matrix(R).as_rotvec(), -R@C]

def run(nframes=120, sig_px=0.15, per_wall=3, sig_tape=0.0005, wall_rough=0.0):
    T, wall = targets(per_wall)
    intr = np.array([F_TRUE, K1, K2, W_IMG/2+3, H_IMG/2-4])
    cams, obs = [], []
    for i in range(nframes):  # Rundgang durch den Raum, Blick zur gegenüberliegenden Wand
        a = 2*np.pi*i/nframes; C = np.array([L/2+1.0*np.cos(a), B/2+0.8*np.sin(a), 1.5+0.05*rng.normal()])
        tgt = np.array([L/2-1.8*np.cos(a+0.4), B/2-1.6*np.sin(a+0.4), 0.9+0.4*np.sin(3*a)])
        cam = look(C, tgt); uv, z = project(T, cam, intr)
        vis = (z>0.3)&(uv[:,0]>20)&(uv[:,0]<W_IMG-20)&(uv[:,1]>20)&(uv[:,1]<H_IMG-20)
        for j in np.where(vis)[0]: obs.append((i,j,*(uv[j]+rng.normal(0,sig_px,2))))
        cams.append(cam)
    cams = np.array(cams); obs = np.array(obs); ci, pj = obs[:,0].astype(int), obs[:,1].astype(int)
    nc, npnt = len(cams), len(T)
    # Startwerte gestört
    c0 = cams + np.r_[rng.normal(0,.02,3), rng.normal(0,.05,3)]*np.ones((nc,1))*0 + rng.normal(0,[.01,.01,.01,.03,.03,.03],(nc,6))
    P0 = T + rng.normal(0,.03,T.shape); i0 = np.array([F_TRUE*1.05,0,0,W_IMG/2,H_IMG/2])
    s1, s2 = np.where(wall==-1)[0][0], np.where(wall==-2)[0][0]
    true_scale = np.linalg.norm(T[s2]-T[s1]); meas_scale = true_scale + rng.normal(0, sig_tape*np.sqrt(2))
    def unpack(x): return x[:5], x[5:5+6*nc].reshape(nc,6), x[5+6*nc:].reshape(npnt,3)
    def res(x):
        intr_, c, P = unpack(x); r = []
        for i in range(nc):
            m = ci==i
            if m.any(): uv,_ = project(P[pj[m]], c[i], intr_); r.append((uv-obs[m,2:]).ravel()/sig_px)
        d = np.linalg.norm(P[s2]-P[s1]); r.append([(d-meas_scale)/sig_tape*1.0])
        # Lagerung: Punkt s1 in Ursprung-nah, Boden z=0 für Bodenmarken (Schwerkraft/Boden als Bezug, schwach)
        r.append((P[s1]-T[s1])*1e3); r.append([(P[s2,1]-T[s2,1])*1e3, P[s2,2]*1e3])
        return np.concatenate(r)
    x0 = np.r_[i0, c0.ravel(), P0.ravel()]
    # dünnbesetzte Jacobi-Struktur
    m = len(res(x0)); A = lil_matrix((m, len(x0)), dtype=int); row = 0
    for i in range(nc):
        for j in pj[ci==i]:
            A[row:row+2, :5] = 1; A[row:row+2, 5+6*i:11+6*i] = 1; A[row:row+2, 5+6*nc+3*j:8+6*nc+3*j] = 1; row += 2
    A[row:, 5+6*nc:] = 1
    sol = least_squares(res, x0, jac_sparsity=A, method='trf', x_scale='jac', max_nfev=60)
    intr_, c, P = unpack(sol.x)
    # Wandrauhigkeit: Zielmarke sitzt auf lokaler Beule
    P = P + np.c_[np.zeros((npnt,2)), np.zeros(npnt)]
    # Wandebenen (vertikal angenommen: Linie in xy durch Marken) -> Abstände gegenüberliegender Wände
    def wline(w):
        Q = P[wall==w][:,:2] + rng.normal(0,wall_rough,(np.sum(wall==w),2)); mu = Q.mean(0); _,_,vt = np.linalg.svd(Q-mu); return mu, vt[0]
    def wdist(w1,w2):
        m1,d1 = wline(w1); m2,d2 = wline(w2); n = np.array([-d1[1],d1[0]]); return abs((m2-m1)@n)
    return np.array([wdist(0,2)-B, wdist(1,3)-L])*1000, len(obs)/nc

for name, kw in [('4K, 120 Bilder, Marken ±0,15 px, 3 je Wand', {}),
                 ('4K, 60 Bilder', {'nframes':60}),
                 ('Marken ±0,3 px (Bewegungsunschärfe)', {'sig_px':0.3}),
                 ('2 Marken je Wand', {'per_wall':2}),
                 ('Wand uneben ±2 mm (Altbau)', {'wall_rough':0.002})]:
    E=[]; 
    for s in range(12):
        rng = np.random.default_rng(100+s); e,vis = run(**kw); E+=list(np.abs(e))
    E=np.sort(E); print(f'{name:<46} median {np.median(E):5.2f} mm  95% {E[int(.95*len(E))-1]:5.2f} mm  max {E[-1]:5.2f}  ({vis:.0f} Marken/Bild)', flush=True)
