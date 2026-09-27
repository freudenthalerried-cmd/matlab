"""Monte-Carlo-Simulation: Genauigkeit verschiedener Messvarianten (Raumplan-App).
Ergebnis: 95%-Fehler (mm) für Wandlängen eines 4,20 x 3,60 m Raumes."""
import numpy as np
rng = np.random.default_rng(1)
ROOM = np.array([[0, 0], [4.2, 0], [4.2, 3.6], [0, 3.6]])  # Boden-Ecken (m)
N = 1500

def camera(W, H, hfov=70, pos=(2.1, -1.2, 1.5), look=(2.1, 2.2, 0)):
    f = W / 2 / np.tan(np.radians(hfov / 2))
    C = np.array(pos, float); z = np.array(look, float) - C; z /= np.linalg.norm(z)
    x = np.cross(z, [0, 0, 1]); x /= np.linalg.norm(x); y = np.cross(z, x)
    R = np.stack([x, y, z]); K = np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1]])
    return K, R, C

def project(K, R, C, P, k1=0.0):
    Pc = (R @ (P - C).T).T; u = Pc[:, :2] / Pc[:, 2:3]
    r2 = (u ** 2).sum(1, keepdims=True); u = u * (1 + k1 * r2)
    return (K[:2, :2] @ u.T).T + K[:2, 2]

def homog(src, dst):
    m = src.mean(0); s = np.sqrt(2) / np.mean(np.linalg.norm(src - m, axis=1))
    T = np.array([[s, 0, -s * m[0]], [0, s, -s * m[1]], [0, 0, 1]])
    p = (T @ np.c_[src, np.ones(len(src))].T).T
    A = []
    for (x, y, _), (X, Y) in zip(p, dst):
        A += [[x, y, 1, 0, 0, 0, -x * X, -y * X, -X], [0, 0, 0, x, y, 1, -x * Y, -y * Y, -Y]]
    h = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3)
    return h @ T

def apply(Hm, p):
    q = (Hm @ np.c_[p, np.ones(len(p))].T).T; return q[:, :2] / q[:, 2:3]

def ref_points(kind):
    if kind == 'rect':  # Kreppband 2 x 1 m
        return np.array([[1.1, 1.3], [3.1, 1.3], [3.1, 2.3], [1.1, 2.3]])
    if kind == 'tapes':  # 2 Maßbänder im L + Rechteck, Markierungen alle 25 cm
        a = [[1.1 + t, 1.3] for t in np.arange(0, 2.01, .25)] + [[1.1, 1.3 + t] for t in np.arange(.25, 2.01, .25)]
        return np.array(a + [[3.1, 2.3], [3.1, 1.3 + 2.0 * 0 + 1.0]])

def video_run(W, H, click, ref='rect', k1=0.0, floor=0.0, tape=0.001, frames=1, skirting=0.0):
    errs = []
    for _ in range(N):
        est = []
        for f in range(frames):
            pos = (2.1 + rng.normal(0, .4), -1.2 + rng.normal(0, .2), 1.5 + rng.normal(0, .1))
            K, R, C = camera(W, H, pos=pos)
            kk = k1 * rng.normal()
            Rw = ref_points(ref); Rtrue = Rw + rng.normal(0, tape, Rw.shape)  # Band nicht exakt gelegt
            z = rng.normal(0, floor, len(Rw))
            img = project(K, R, C, np.c_[Rtrue, z], kk) + rng.normal(0, click, (len(Rw), 2))
            Hm = homog(img, Rw)
            cz = rng.normal(0, floor, 4)
            cimg = project(K, R, C, np.c_[ROOM, cz], kk) + rng.normal(0, click, (4, 2))
            est.append(apply(Hm, cimg))
        e = np.mean(est, 0)
        L = [np.linalg.norm(e[(i + 1) % 4] - e[i]) - 2 * skirting for i in range(4)]
        T = [np.linalg.norm(ROOM[(i + 1) % 4] - ROOM[i]) for i in range(4)]
        errs.append(np.array(L) - T)
    return np.abs(np.array(errs)) * 1000

def lsq_room(obs, x0, iters=8):
    """Gauss-Newton-Ausgleich: obs = [(typ, i, j, wert, sigma)], typ 'd' Strecke."""
    x = x0.copy().ravel()
    for _ in range(iters):
        A, r, w = [], [], []
        for t, i, j, v, s in obs:
            P = x.reshape(-1, 2); d = P[j] - P[i]; L = np.linalg.norm(d); row = np.zeros_like(x)
            row[2 * j:2 * j + 2] = d / L; row[2 * i:2 * i + 2] = -d / L
            A.append(row); r.append(v - L); w.append(1 / s)
        # Datum: Punkt 0 fix, Punkt 1 y fix
        for k, val in ((0, 0), (1, 0), (3, 0)):
            row = np.zeros_like(x); row[k] = 1; A.append(row); r.append(val - x[k]); w.append(1e6)
        A = np.array(A) * np.array(w)[:, None]; r = np.array(r) * np.array(w)
        x += np.linalg.lstsq(A, r, rcond=None)[0]
    return x.reshape(-1, 2)

def tape_run(sig_len, sig_diag, diags=True, skew_deg=0.0, assume_right=False):
    errs = []
    for _ in range(N):
        room = ROOM.copy()
        room[2] += [np.radians(skew_deg) * 3.6 * rng.normal(), 0]; room[3] += [np.radians(skew_deg) * 3.6 * rng.normal(), 0]
        obs = [('d', i, (i + 1) % 4, np.linalg.norm(room[(i + 1) % 4] - room[i]) + rng.normal(0, sig_len), sig_len) for i in range(4)]
        if diags:
            obs += [('d', 0, 2, np.linalg.norm(room[2] - room[0]) + rng.normal(0, sig_diag), sig_diag),
                    ('d', 1, 3, np.linalg.norm(room[3] - room[1]) + rng.normal(0, sig_diag), sig_diag)]
            est = lsq_room(obs, ROOM + rng.normal(0, .02, ROOM.shape))
        else:  # ohne Diagonalen: rechte Winkel angenommen
            a, b = obs[0][3], obs[1][3]; est = np.array([[0, 0], [a, 0], [a, b], [0, b]])
        # Fehler: Lage der Ecken nach bester Überlagerung (Form-Fehler) -> max Eckabweichung
        d = est - est[0]; t = room - room[0]
        ang = np.arctan2(t[1, 1], t[1, 0]) - np.arctan2(d[1, 1], d[1, 0])
        Rm = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]]); d = (Rm @ d.T).T
        errs.append(np.linalg.norm(d - t, axis=1).max())
    return np.array(errs) * 1000

def p95(a): return np.percentile(a, 95)

rows = [
 ('V1 Video 1080p, Rechteck 2x1 m, Tippen ±1,5 px', video_run(1920, 1080, 1.5)),
 ('V2 Foto 4000x3000, Rechteck, Tippen ±1,5 px', video_run(4000, 3000, 1.5)),
 ('V3 Foto + 2 Maßbänder (17 Referenzpunkte)', video_run(4000, 3000, 1.5, 'tapes')),
 ('V4 V3 + Subpixel-Eckenfang (±0,4 px)', video_run(4000, 3000, 0.4, 'tapes')),
 ('V5 V4 + 3 Fotos gemittelt', video_run(4000, 3000, 0.4, 'tapes', frames=3)),
 ('V6 V5 + Restverzeichnung k1=0,01', video_run(4000, 3000, 0.4, 'tapes', k1=0.01, frames=3)),
 ('V7 V5 + Altbau-Boden uneben ±3 mm', video_run(4000, 3000, 0.4, 'tapes', floor=0.003, frames=3)),
]
print('Wandlängen-Fehler (mm)          Median   95%')
for n, e in rows: print(f'{n:<48} {np.median(e):6.1f} {p95(e):6.1f}')
print('\nMaßband-Varianten: max. Eckfehler nach Überlagerung (mm)   Median  95%')
for n, e in [
 ('T1 4 Wände, rechte Winkel angenommen, Altbau 0,5°', tape_run(.0015, .002, diags=False, skew_deg=.5)),
 ('T2 4 Wände + 2 Diagonalen, Ausgleich, Altbau 0,5°', tape_run(.0015, .002, skew_deg=.5)),
 ('T3 wie T2, Maßband sorgfältig ±1 mm', tape_run(.001, .0015, skew_deg=.5)),
 ('T4 wie T2, Maßband ungenau ±3 mm', tape_run(.003, .004, skew_deg=.5)),
]: print(f'{n:<52} {np.median(e):6.1f} {p95(e):6.1f}')

# ---- Möblierte Räume: Diagonalen oft verstellt -> Eckwinkel über Sehne (Dreieck an der Ecke) ----
def ang_at(P, v):
    a = P[v - 1] - P[v]; b = P[(v + 1) % len(P)] - P[v]
    return np.arctan2(a[0] * b[1] - a[1] * b[0], a @ b)

def lsq_gen(obs, x0, iters=10):
    """Allgemeiner Ausgleich mit numerischer Jacobi-Matrix. obs: (f(P)->wert, messwert, sigma)."""
    x = x0.ravel().copy(); n = len(x)
    for _ in range(iters):
        A, r = [], []
        for f, v, s in obs:
            P = x.reshape(-1, 2); f0 = f(P); row = np.zeros(n)
            for k in range(n):
                xx = x.copy(); xx[k] += 1e-7; row[k] = (f(xx.reshape(-1, 2)) - f0) / 1e-7
            A.append(row / s); r.append((v - f0) / s)
        for k in (0, 1, 3):
            row = np.zeros(n); row[k] = 1e6; A.append(row); r.append(-x[k] * 1e6)
        x += np.linalg.lstsq(np.array(A), np.array(r), rcond=None)[0]
    return x.reshape(-1, 2)

def shape_err(est, room):
    d = est - est[0]; t = room - room[0]
    ang = np.arctan2(t[1, 1], t[1, 0]) - np.arctan2(d[1, 1], d[1, 0])
    Rm = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]]); d = (Rm @ d.T).T
    return np.linalg.norm(d - t, axis=1).max()

def chord_run(sig_len, leg, sig_chord, n_corners=4, photo_ang=None, NN=400):
    errs = []
    for _ in range(NN):
        room = ROOM.copy()
        room[2] += [np.radians(.5) * 3.6 * rng.normal(), 0]; room[3] += [np.radians(.5) * 3.6 * rng.normal(), 0]
        obs = [(lambda P, i=i: np.linalg.norm(P[(i + 1) % 4] - P[i]), np.linalg.norm(room[(i + 1) % 4] - room[i]) + rng.normal(0, sig_len), sig_len) for i in range(4)]
        for v in range(n_corners):
            th = abs(ang_at(room, v)); c = np.sqrt(2 * leg ** 2 * (1 - np.cos(th))) + rng.normal(0, sig_chord)
            thm = np.arccos(np.clip(1 - c ** 2 / (2 * leg ** 2), -1, 1)); s = sig_chord / (leg * np.sin(thm) + 1e-9)
            if photo_ang is not None: thm = th + rng.normal(0, np.radians(photo_ang)); s = np.radians(photo_ang)
            obs.append((lambda P, v=v: abs(ang_at(P, v)), thm, s))
        errs.append(shape_err(lsq_gen(obs, ROOM + rng.normal(0, .02, ROOM.shape)), room))
    return np.array(errs) * 1000

print('\nMöbliert (ohne Diagonalen): max. Eckfehler (mm)            Median  95%')
for n, e in [
 ('T5 4 Wände + Eckwinkel über Sehne, Schenkel 1,0 m', chord_run(.0015, 1.0, .0015)),
 ('T6 4 Wände + Eckwinkel über Sehne, Schenkel 1,5 m', chord_run(.0015, 1.5, .0015)),
 ('T7 4 Wände + Eckwinkel nur an 2 Ecken, 1,5 m', chord_run(.0015, 1.5, .0015, n_corners=2)),
 ('H1 4 Wände + Winkel aus Foto (±0,3°)', chord_run(.0015, 1.5, .0015, photo_ang=.3)),
 ('H2 4 Wände + Winkel aus Foto (±0,1°)', chord_run(.0015, 1.5, .0015, photo_ang=.1)),
]: print(f'{n:<52} {np.median(e):6.1f} {p95(e):6.1f}')
