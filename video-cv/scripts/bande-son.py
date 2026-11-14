"""Bande-son synthétisée, calée sur la timeline de la vidéo.

Musique : 120 BPM (temps = 0,5 s, mesure = 2 s), grille d'accords par chapitre.
Bruitages : posés sur les repères exportés par la page (out/reperes.json).
Aucun échantillon externe, aucun service : tout est calculé ici.

Lancer : python scripts/bande-son.py  →  out/bande-son.wav (48 kHz, stéréo, 24 bits)
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy import signal

RACINE = Path(__file__).resolve().parent.parent
SR = 48000
REP = json.loads((RACINE / 'out/reperes.json').read_text(encoding='utf-8'))
DUREE = float(REP['duree'])
N = int(SR * DUREE)
rng = np.random.default_rng(20261008)

BUS = {k: np.zeros((2, N)) for k in ('musique', 'batterie', 'basse', 'sfx', 'envoi')}


# ---------------------------------------------------------------- outils
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tps(n):
    return np.arange(n) / SR


def sos(kind, fc, order=2):
    fc = np.clip(fc, 20, SR / 2 - 200)
    return signal.butter(order, fc, kind, fs=SR, output='sos')


def filtre(x, kind, fc, order=2):
    return signal.sosfilt(sos(kind, fc, order), x)


def filtre_variable(x, kind, fcs, bloc=256):
    """Filtre dont la fréquence suit la courbe fcs (même longueur que x), par blocs."""
    y = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), bloc):
        fc = float(np.mean(fcs[i:i + bloc]))
        if kind == 'bandpass':
            s = sos('bandpass', [fc / 1.6, fc * 1.6], 2)
        else:
            s = sos(kind, fc, 2)
        if zi is None or zi.shape[0] != s.shape[0]:
            zi = np.zeros((s.shape[0], 2))
        y[i:i + bloc], zi = signal.sosfilt(s, x[i:i + bloc], zi=zi)
    return y


def ajouter(bus, x, t0, gain=1.0, pan=0.0, envoi=0.0):
    """Pose un signal mono (ou stéréo 2×n) à t0 secondes, panoramique à puissance constante."""
    i0 = int(round(t0 * SR))
    if x.ndim == 1:
        g = np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
        x = np.vstack([x * g[0], x * g[1]])
    if i0 < 0:
        x = x[:, -i0:]
        i0 = 0
    n = min(x.shape[1], N - i0)
    if n <= 0:
        return
    BUS[bus][:, i0:i0 + n] += x[:, :n] * gain
    if envoi:
        BUS['envoi'][:, i0:i0 + n] += x[:, :n] * gain * envoi


def enveloppe(n, a=0.005, r=0.05, courbe=1.0):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** courbe
    e[-nr:] *= np.linspace(1, 0, nr) ** courbe
    return e


def dent_de_scie(f, n, phase=0.0):
    ph = (phase + np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR) % 1.0
    return 2 * ph - 1


def sinus(f, n, phase=0.0):
    if np.isscalar(f):
        return np.sin(2 * np.pi * f * tps(n) + phase)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def bruit(n):
    return rng.uniform(-1, 1, n)


# ---------------------------------------------------------------- instruments
def nappe(notes, t0, duree, coupure=1400, gain=0.05, a=0.9, r=1.4):
    n = int((duree + r) * SR)
    g = np.zeros(n)
    d = np.zeros(n)
    for m in notes:
        f = hz(m)
        g += dent_de_scie(f * 2 ** (-9 / 1200), n, rng.random()) + 0.6 * dent_de_scie(f, n, rng.random())
        d += dent_de_scie(f * 2 ** (9 / 1200), n, rng.random()) + 0.6 * dent_de_scie(f, n, rng.random())
    env = np.ones(n)
    na, nr, nd = int(a * SR), int(r * SR), int(duree * SR)
    env[:na] = np.linspace(0, 1, na) ** 2
    env[nd:] = np.linspace(1, 0, n - nd) ** 2
    g, d = filtre(g, 'lowpass', coupure) * env, filtre(d, 'lowpass', coupure) * env
    ajouter('musique', np.vstack([g, d]), t0, gain / len(notes) ** 0.5, envoi=0.5)


def corde(f, t0, duree=2.4, amorti=0.996, clarte=0.55, gain=0.2, pan=0.0):
    """Karplus-Strong : corde pincée (guitare du chapitre « avant »)."""
    L = max(2, int(round(SR / f)))
    n = int(duree * SR)
    exc = signal.lfilter([clarte], [1, -(1 - clarte)], bruit(L))
    y = np.zeros(n + L + 1)
    y[:L] = exc
    for i in range(L, n + L, L):
        j = min(i + L, n + L + 1)
        k = j - i
        prec = y[i - L - 1:i - L - 1 + k] if i - L - 1 >= 0 else np.concatenate([[0], y[i - L:i - L + k - 1]])
        y[i:j] = amorti * 0.5 * (y[i - L:i - L + k] + prec)
    y = y[:n] * enveloppe(n, 0.001, 0.2)
    ajouter('musique', y, t0, gain, pan, envoi=0.3)


def marimba(f, t0, gain=0.2, pan=0.0, duree=1.4, bus='musique', envoi=0.35):
    n = int(duree * SR)
    t = tps(n)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
         + 0.28 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 10)
         + 0.07 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 22))
    y += filtre(bruit(n), 'bandpass', [1500, 5000]) * np.exp(-t * 300) * 0.15
    y *= enveloppe(n, 0.0015, 0.05)
    ajouter(bus, y, t0, gain, pan, envoi)


def piano_fm(f, t0, gain=0.15, pan=0.0, duree=2.6):
    """Piano électrique (FM ratio 1) pour la clôture."""
    n = int(duree * SR)
    t = tps(n)
    indice = 1.6 * np.exp(-t * 3.5) + 0.2
    y = np.sin(2 * np.pi * f * t + indice * np.sin(2 * np.pi * f * t))
    y += 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 2)
    y *= np.exp(-t * 1.3) * enveloppe(n, 0.003, 0.3)
    ajouter('musique', y, t0, gain, pan, envoi=0.5)


def cloche(f, t0, gain=0.12, pan=0.0, duree=3.0, bus='sfx', envoi=0.6):
    n = int(duree * SR)
    t = tps(n)
    y = np.sin(2 * np.pi * f * t + 2.4 * np.exp(-t * 2.2) * np.sin(2 * np.pi * f * 1.41 * t))
    y *= np.exp(-t * 1.5) * enveloppe(n, 0.002, 0.4)
    ajouter(bus, y, t0, gain, pan, envoi)


def grosse_caisse(t0, gain=0.6):
    n = int(0.55 * SR)
    t = tps(n)
    f = 44 + 115 * np.exp(-t * 30)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    y += bruit(n) * np.exp(-t * 350) * 0.25
    ajouter('batterie', y * enveloppe(n, 0.0005, 0.05), t0, gain)
    COUPS.append(t0)


def claque(t0, gain=0.25, pan=0.0):
    n = int(0.3 * SR)
    t = tps(n)
    e = np.zeros(n)
    for k, dt in enumerate((0, 0.009, 0.018)):
        i = int(dt * SR)
        e[i:] += np.exp(-(t[: n - i]) * (60 if k < 2 else 16)) * (0.7 if k < 2 else 1)
    y = filtre(bruit(n), 'bandpass', [1000, 4500]) * e
    ajouter('batterie', y, t0, gain, pan, envoi=0.25)


def charleston(t0, gain=0.07, ouvert=False, pan=0.15):
    n = int((0.28 if ouvert else 0.06) * SR)
    t = tps(n)
    y = filtre(bruit(n), 'highpass', 7500) * np.exp(-t * (14 if ouvert else 70))
    ajouter('batterie', y, t0, gain, pan)


def shaker(t0, gain=0.05, pan=-0.2):
    n = int(0.09 * SR)
    t = tps(n)
    e = np.minimum(t / 0.012, 1) * np.exp(-np.maximum(t - 0.012, 0) * 45)
    ajouter('batterie', filtre(bruit(n), 'bandpass', [4000, 9500]) * e, t0, gain, pan)


def claquement_doigts(t0, gain=0.14, pan=0.1):
    n = int(0.12 * SR)
    t = tps(n)
    y = filtre(bruit(n), 'bandpass', [1800, 4200]) * np.exp(-t * 70) + 0.4 * np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 90)
    ajouter('batterie', y, t0, gain, pan, envoi=0.3)


def basse(m, t0, duree, gain=0.22):
    n = int((duree + 0.06) * SR)
    f = hz(m)
    y = np.sin(2 * np.pi * f * tps(n)) + 0.25 * np.sin(4 * np.pi * f * tps(n))
    y += 0.35 * filtre(dent_de_scie(f, n), 'lowpass', 380)
    ajouter('basse', y * enveloppe(n, 0.006, 0.06), t0, gain)


def arpege_scie(m, t0, gain=0.05, pan=0.0, coupure=2600):
    n = int(0.32 * SR)
    t = tps(n)
    y = filtre(dent_de_scie(hz(m), n) + 0.5 * dent_de_scie(hz(m) * 1.004, n), 'lowpass', coupure) * np.exp(-t * 11)
    ajouter('musique', y * enveloppe(n, 0.002, 0.03), t0, gain, pan, envoi=0.35)


# ---------------------------------------------------------------- bruitages
def souffle(t0, duree, f0=300, f1=4000, gain=0.25, pan0=-0.6, pan1=0.6, sens='aller'):
    n = int(duree * SR)
    x = np.linspace(0, 1, n)
    fcs = f0 * (f1 / f0) ** (x if sens == 'aller' else np.sin(np.pi * x))
    y = filtre_variable(bruit(n), 'bandpass', fcs)
    env = np.sin(np.pi * np.minimum(x / 0.7, 1) / 2) ** 2 * np.where(x > 0.7, np.cos((x - 0.7) / 0.3 * np.pi / 2) ** 2, 1)
    y *= env
    p = pan0 + (pan1 - pan0) * x
    st = np.vstack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)]) * np.sqrt(2)
    ajouter('sfx', st, t0, gain, envoi=0.35)


def montee(t0, duree, gain=0.22):
    n = int(duree * SR)
    x = np.linspace(0, 1, n)
    b = filtre_variable(bruit(n), 'highpass', 200 * 30 ** x) * x ** 2.2
    f = 110 * 8 ** (x ** 1.5)
    s = filtre(dent_de_scie(f, n) + dent_de_scie(f * 1.007, n), 'lowpass', 3000) * x ** 2.5 * 0.35
    ajouter('sfx', b + s, t0, gain, envoi=0.4)


def impact(t0, gain=0.7, sub=True):
    n = int(2.2 * SR)
    t = tps(n)
    y = filtre(bruit(n), 'lowpass', 2500) * np.exp(-t * 7) * 0.7
    if sub:
        y += np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-t * 4)) / SR) * np.exp(-t * 1.8)
    y += np.sin(2 * np.pi * np.cumsum(50 + 120 * np.exp(-t * 25)) / SR) * np.exp(-t * 5) * 0.8
    ajouter('sfx', y * enveloppe(n, 0.001, 0.3), t0, gain, envoi=0.5)


def gonflement_inverse(t0, duree, gain=0.25):
    n = int(duree * SR)
    x = np.linspace(0, 1, n)
    y = filtre_variable(bruit(n), 'lowpass', 400 * 15 ** x) * x ** 3
    y += sinus(200 * 4 ** x, n) * x ** 4 * 0.3
    ajouter('sfx', y * enveloppe(n, 0.01, 0.004), t0, gain, envoi=0.3)


def pop(f, t0, gain=0.12, pan=0.0, duree=0.16, envoi=0.25):
    n = int(duree * SR)
    t = tps(n)
    fr = f * (1 + 0.12 * np.exp(-t * 120))
    y = (np.sin(2 * np.pi * np.cumsum(fr) / SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(fr) / SR)) * np.exp(-t * 26)
    ajouter('sfx', y * enveloppe(n, 0.001, 0.02), t0, gain, pan, envoi)


def rebond(f, t0, gain=0.22, pan=0.0):
    n = int(0.25 * SR)
    t = tps(n)
    fr = f * (0.55 + 0.45 * (1 - np.exp(-t * 60)))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 14)
    ajouter('sfx', y * enveloppe(n, 0.001, 0.03), t0, gain * 0.6, pan, envoi=0.2)
    marimba(f, t0, gain * 0.8, pan, bus='sfx')


def touche(t0, gain=0.05):
    n = int(0.03 * SR)
    t = tps(n)
    g = 0.6 + 0.4 * rng.random()
    y = filtre(bruit(n), 'highpass', 2500) * np.exp(-t * 900) + 0.6 * np.sin(2 * np.pi * (150 + 70 * rng.random()) * t) * np.exp(-t * 260)
    ajouter('sfx', y, t0, gain * g, pan=(rng.random() - 0.5) * 0.5)


def cran(t0, gain=0.07):
    n = int(0.03 * SR)
    t = tps(n)
    y = filtre(bruit(n), 'bandpass', [2000, 3200]) * np.exp(-t * 400) + 0.5 * np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 500)
    ajouter('sfx', y, t0, gain, pan=0.1)


def scintillement(t0, gain=0.06, notes=(81, 84, 88, 91, 93, 96), duree=1.2):
    for k in range(14):
        m = notes[k % len(notes)] + (12 if k > 9 else 0)
        dt = k * duree / 14 + rng.random() * 0.03
        cloche(hz(m), t0 + dt, gain * (1 - k / 18), pan=(rng.random() - 0.5) * 1.4, duree=1.4)


def etincelles(t0, duree, gain=0.05):
    """Crépitement électrique du circuit qui s'allume, de plus en plus dense."""
    n = int(duree * SR)
    x = np.linspace(0, 1, n)
    y = np.zeros(n)
    k = 0
    while k < n:
        k += int(SR * (0.03 - 0.025 * (k / n)) * (0.5 + rng.random()))
        if k >= n:
            break
        m = min(n - k, 300)
        y[k:k + m] += bruit(m) * np.exp(-np.arange(m) / 30)
    y = filtre(y, 'highpass', 1500)
    hum = filtre(dent_de_scie(60 * (1 + x), n), 'bandpass', [200, 1800]) * x * 0.3
    ajouter('sfx', y + hum, t0, gain, envoi=0.2)


# ---------------------------------------------------------------- musique
ACC = {
    'Am': (45, [57, 60, 64, 71], [69, 72, 76, 79]),
    'F': (41, [53, 57, 60, 67], [65, 69, 72, 76]),
    'C': (48, [55, 60, 64, 74], [67, 72, 76, 79]),
    'G': (43, [55, 59, 62, 69], [67, 71, 74, 79]),
    'E': (40, [56, 59, 64, 71], [68, 71, 76, 80]),
}
GRILLE = [
    (0, 'Am', 4), (4, 'F', 3), (7, 'G', 2),
    (9, 'C', 2), (11, 'Am', 2), (13, 'F', 2), (15, 'G', 2), (17, 'C', 2), (19, 'Am', 2), (21, 'F', 1), (22, 'E', 2),
    (24, 'Am', 4), (28, 'F', 2),
    (30, 'Am', 2), (32, 'F', 2), (34, 'C', 2), (36, 'G', 2), (38, 'Am', 2), (40, 'F', 2), (42, 'G', 2),
    (44, 'C', 2), (46, 'G', 2), (48, 'Am', 2), (50, 'F', 2), (52, 'C', 2), (54, 'G', 2), (56, 'F', 2),
    (58, 'Am', 2), (60, 'F', 2), (62, 'C', 2), (64, 'G', 2), (66, 'Am', 2),
    (68, 'F', 2), (70, 'G', 2), (72, 'E', 2),
    (74, 'F', 2), (76, 'G', 2), (78, 'Am', 2), (80, 'F', 2), (82, 'C', 4),
]
COUPS = []


def accord_a(t):
    for d, nom, du in GRILLE:
        if d <= t < d + du:
            return nom
    return 'C'


def temps(a, b, pas=0.5):
    return np.arange(a, b - 1e-9, pas)


# Nappes : couleur différente par chapitre
for d, nom, du in GRILLE:
    b, p, _ = ACC[nom]
    if d < 9:
        nappe(p, d, du, coupure=700 + 120 * d, gain=0.10)
    elif d < 24:
        nappe(p, d, du, coupure=900, gain=0.045)
    elif d < 30:
        nappe([m - 12 for m in p[:3]] + [p[3]], d, du, coupure=650, gain=0.07)
    elif d < 44:
        nappe(p, d, du, coupure=1500, gain=0.06)
    elif d < 58:
        nappe(p, d, du, coupure=2200, gain=0.04)
    elif d < 74:
        nappe(p, d, du, coupure=1500, gain=0.055)
    else:
        nappe(p, d, du, coupure=1100, gain=0.08, r=2.5 if d >= 82 else 1.4)

# Chapitre « avant » : guitare en arpèges, shaker, batterie légère
MOTIF_GUIT = [0, 2, 3, 1, 2, 3, 1, 2]
for t in temps(9, 22, 0.25):
    nom = accord_a(t)
    b, p, a = ACC[nom]
    voix = [b + 12, p[1], p[2], p[3] if p[3] < 72 else p[3] - 12]
    k = int(round((t - 9) / 0.25)) % 8
    corde(hz(voix[MOTIF_GUIT[k]]), t, gain=0.16 if k % 2 == 0 else 0.11, pan=-0.25 + 0.5 * (k % 4) / 3)
for t in temps(9, 22, 0.25):
    shaker(t, gain=0.045 if (t * 4) % 2 else 0.03)
for t in temps(11, 22, 1.0):
    grosse_caisse(t, 0.35)
for t in temps(13.5, 22, 1.0):
    claquement_doigts(t, 0.09)
for d, nom, du in GRILLE:
    if 9 <= d < 22:
        basse(ACC[nom][0], d, du - 0.05, gain=0.16)
# accord de mi tenu sous la montée
for m in (52, 56, 59, 64):
    corde(hz(m), 22.0, duree=2.0, gain=0.12)

# Chapitre « code » : pulsation sombre
for t in temps(24, 29.25, 0.25):
    basse(ACC[accord_a(t)][0] - 12 + 12, t, 0.2, gain=0.13 if (t * 4) % 2 == 0 else 0.08)
for t in temps(24, 29.25, 1.0):
    grosse_caisse(t, 0.45)
for t in temps(24, 29.25, 0.25):
    charleston(t, 0.035 if (t * 4) % 2 else 0.05)


def groove(a, b, arp=True, var=0):
    for t in temps(a, b, 0.5):
        grosse_caisse(t, 0.55)
    for t in temps(a + 0.5, b, 1.0):
        claque(t, 0.22)
    for t in temps(a, b, 0.25):
        pos = int(round((t - a) / 0.25)) % 4
        if pos == 2:
            charleston(t, 0.06, ouvert=True)
        else:
            charleston(t, 0.035 if pos % 2 else 0.05)
    for t in temps(a, b, 0.25):
        nom = accord_a(t)
        b0 = ACC[nom][0]
        pos = int(round((t - a) / 0.25)) % 8
        motif = [0, None, 12, 0, None, 0, 12, None] if var == 0 else [0, None, None, 12, None, 0, None, 7]
        if motif[pos] is not None:
            basse(b0 + motif[pos] - 12 + 12, t, 0.2, gain=0.2)
    if arp:
        for t in temps(a, b, 0.125):
            nom = accord_a(t)
            notes = ACC[nom][2]
            k = int(round((t - a) / 0.125))
            arpege_scie(notes[[0, 1, 2, 3, 2, 1][k % 6]], t, gain=0.035, pan=0.4 * np.sin(k * 0.7), coupure=1800 + 900 * np.sin(t * 0.8) ** 2)


groove(30, 42)
groove(58, 67.5, arp=False, var=1)

# Lunello : bascule en do majeur, kalimba et claquements de doigts
for t in temps(46, 56.5, 1.0):
    grosse_caisse(t, 0.4)
for t in temps(46.5, 56.5, 1.0):
    claquement_doigts(t, 0.13)
for t in temps(46, 56.5, 0.25):
    shaker(t, 0.04 if (t * 4) % 2 else 0.028, pan=0.25)
for t in temps(46, 56.5, 0.5):
    nom = accord_a(t)
    pos = int(round((t - 46) / 0.5)) % 4
    basse(ACC[nom][0] + (0 if pos in (0, 3) else 7), t, 0.35, gain=0.17)
MOTIF_KAL = [0, 2, 1, 3, 2, 1, 3, 2]
for t in temps(48, 56.5, 0.25):
    nom = accord_a(t)
    k = int(round((t - 48) / 0.25))
    if k % 8 in (1, 5) and k % 16 > 8:
        continue
    marimba(hz(ACC[nom][2][MOTIF_KAL[k % 8]] + 12), t, gain=0.075, pan=0.35 * np.sin(k * 1.3), duree=0.9)

# Chiffres-clés : battue simple sous les impacts
for t in temps(68, 73.75, 0.5):
    grosse_caisse(t, 0.5)
for t in temps(68, 73.75, 0.25):
    charleston(t, 0.04 if (t * 4) % 2 else 0.055)
for d, nom, du in GRILLE:
    if 68 <= d < 74:
        basse(ACC[nom][0], d, du - 0.05, gain=0.2)

# Clôture : piano électrique, puis pouls léger sous le nom
for d, nom, du in GRILLE:
    if d >= 74:
        b, p, a = ACC[nom]
        for k, m in enumerate([b + 12] + p):
            piano_fm(hz(m), d + k * 0.03, gain=0.07, pan=-0.3 + 0.15 * k, duree=min(du, 4) + 0.8)
        basse(b, d, du - 0.05, gain=0.12)
for t in temps(80.85, 84.5, 1.0):
    grosse_caisse(t, 0.3)

# ---------------------------------------------------------------- repères → bruitages
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]
for r in REP['reperes']:
    t, ty = r['t'], r['type']
    if ty == 'graine':
        cloche(hz(88), t, 0.07, duree=2.5)
        pop(hz(76), t, 0.08)
    elif ty == 'orbite':
        souffle(t, r['duree'], 350, 2800, 0.18, -0.8, 0.8, sens='aller')
        scintillement(t + 0.2, 0.025, duree=r['duree'] * 0.8)
    elif ty == 'verrou':
        for k, m in enumerate((81, 84, 88)):
            cloche(hz(m), t + k * 0.035, 0.085, pan=-0.4 + 0.4 * k)
    elif ty == 'circuit':
        etincelles(t, r['duree'], 0.07)
    elif ty == 'pousse':
        souffle(t, r['duree'] + 0.3, 200, 1800, 0.12, 0, 0)
    elif ty == 'olive':
        marimba(hz([76, 79, 81][r['n'] % 3] + 12), t, 0.16, pan=[-0.3, 0.3, 0][r['n'] % 3], bus='sfx')
    elif ty == 'glisse':
        souffle(t, 0.9, 500, 2500, 0.11, -0.3, 0.3)
    elif ty == 'titre':
        souffle(t - 0.15, 0.5, 2500, 600, 0.09, 0.2, -0.2)
        impact(t, 0.16, sub=False)
    elif ty == 'souffle':
        souffle(t - 0.1, r['duree'] + 0.35, 200, 6000, 0.3, -0.7, 0.7)
    elif ty == 'impactDoux':
        impact(t, 0.25, sub=False)
    elif ty == 'etape':
        souffle(t - 0.05, 0.35, 1500, 5000, 0.07, 0.3, -0.1)
        pop(hz(57), t, 0.1, duree=0.2)
    elif ty == 'cran':
        cran(t)
    elif ty == 'montee':
        montee(t, r['duree'] + 0.12)
    elif ty == 'chute':
        impact(t, 0.75)
    elif ty == 'frappe':
        touche(t)
    elif ty == 'valide':
        cloche(hz(88), t, 0.08, duree=1.5)
        cloche(hz(93), t + 0.09, 0.08, duree=1.8)
    elif ty == 'repli':
        gonflement_inverse(t, r['duree'] + 0.1)
    elif ty == 'impact':
        impact(t, 0.62)
    elif ty == 'eclosion':
        scintillement(t, 0.05)
    elif ty == 'nuee':
        souffle(t, r['duree'], 600, 5000, 0.16, -0.9, 0.9)
    elif ty == 'puce':
        n = r['n']
        pop(hz(PENTA[n % 11]), t, 0.035, pan=((n * 37) % 11) / 5.5 - 1, duree=0.12)
    elif ty == 'heros':
        n = r['n']
        cloche(hz([81, 84, 86, 88, 91, 93][n]), t, 0.09, pan=-0.5 + 0.2 * n, duree=2.0)
        pop(hz([69, 72, 74, 76, 79, 81][n]), t, 0.08)
    elif ty == 'cascade':
        for k in range(14):
            pop(hz(PENTA[10 - (k % 11)] - (12 if k > 10 else 0)), t + k * r['duree'] / 14, 0.04, pan=(rng.random() - 0.5) * 1.6)
    elif ty == 'rebond':
        n = r['n']
        rebond(hz([72, 74, 76, 79, 81, 84, 86][n]), t, 0.2, pan=-0.6 + 0.2 * n)
    elif ty == 'accord':
        for k, m in enumerate((84, 88, 91, 96)):
            cloche(hz(m), t + k * 0.03, 0.06, pan=-0.45 + 0.3 * k, duree=2.2)
            marimba(hz(m - 12), t + k * 0.03, 0.06, bus='sfx')
    elif ty == 'sourire':
        souffle(t, r['duree'], 1200, 7000, 0.07, -0.5, 0.5)
    elif ty == 'perso':
        n = r['n']
        pop(hz([79, 76, 72, 76, 81][n]), t, 0.11, pan=-0.6 + 0.3 * n, duree=0.2)
    elif ty == 'pastille':
        pop(hz([76, 79, 81, 84][r['n'] % 4]), t, 0.07)
    elif ty == 'balayage':
        souffle(t, 0.45, 1500, 7000, 0.06, 0.5, -0.2)
    elif ty == 'carte':
        souffle(t, 0.6, 800, 4500, 0.1, 0.7, -0.5)
        pop(hz(45), t + 0.3, 0.15, duree=0.3, envoi=0.1)
    elif ty == 'accordFin':
        impact(t, 0.22, sub=False)
    elif ty == 'eclat':
        scintillement(t, 0.04, notes=(84, 88, 91, 96), duree=1.0)

# ---------------------------------------------------------------- mixage
# compression latérale : la nappe, la basse et les arpèges respirent sous la grosse caisse
cote = np.zeros(N)
for t in COUPS:
    i = int(t * SR)
    n = min(int(0.32 * SR), N - i)
    cote[i:i + n] = np.maximum(cote[i:i + n], np.exp(-np.arange(n) / (0.09 * SR)))
pompe = 1 - 0.45 * cote
BUS['musique'] *= pompe
BUS['basse'] *= 1 - 0.3 * cote

# réverbération : réponse impulsionnelle synthétique, stéréo décorrélée
nir = int(2.6 * SR)
tir = tps(nir)
ir = np.vstack([bruit(nir), bruit(nir)]) * np.exp(-tir / 0.55)
ir = np.vstack([filtre(ir[0], 'lowpass', 6000), filtre(ir[1], 'lowpass', 5500)])
ir[:, : int(0.012 * SR)] = 0
ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
envoi = np.vstack([filtre(BUS['envoi'][c], 'highpass', 250) for c in range(2)])
retour = np.vstack([signal.fftconvolve(envoi[c], ir[c])[:N] for c in range(2)])

mix = BUS['musique'] + BUS['batterie'] + BUS['basse'] * 1.1 + BUS['sfx'] + retour * 0.42
mix = np.vstack([filtre(mix[c], 'highpass', 28) for c in range(2)])
# fondu d'entrée et de sortie
mix[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
fin = int(1.3 * SR)
mix[:, -fin:] *= np.linspace(1, 0, fin) ** 1.5
# saturation douce puis normalisation crête à −1 dBFS
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix *= 0.891 / np.max(np.abs(mix))

pcm = (np.clip(mix.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
octets = pcm.astype('<i4').tobytes()
trois = bytearray()
b = np.frombuffer(octets, dtype=np.uint8).reshape(-1, 4)[:, :3]
with wave.open(str(RACINE / 'out/bande-son.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b.tobytes())
rms = {k: float(np.sqrt(np.mean(v ** 2))) for k, v in BUS.items()}
print('RMS par bus :', {k: f'{20 * np.log10(v + 1e-12):.1f} dB' for k, v in rms.items()})
print(f'out/bande-son.wav — {DUREE:.1f} s, {len(REP["reperes"])} repères sonores')
