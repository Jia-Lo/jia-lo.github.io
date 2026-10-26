# Genera texturas fotorrealistas procedurales para el pasillo 3D
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import zoom, gaussian_filter, sobel
OUT = "/home/claude/site/pasillo/tex/"
rng = np.random.default_rng(7)

def fbm(h, w, oct=6, base=4, pers=.55, seed=None):
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w)); amp = 1; tot = 0
    for o in range(oct):
        f = base * 2 ** o
        g = r.standard_normal((max(2, int(h / w * f)) + 3, f + 3))
        z = zoom(g, (h / (g.shape[0] - 3), w / (g.shape[1] - 3)), order=3)[:h, :w]
        acc += z * amp; tot += amp; amp *= pers
    acc /= tot
    return (acc - acc.mean()) / (acc.std() + 1e-9)

def normal_from(height, strength):
    gx = sobel(height, axis=1); gy = sobel(height, axis=0)
    n = np.dstack([-gx * strength, gy * strength, np.ones_like(height)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))

def save(a, name, q=88):
    a = np.clip(a, 0, 255).astype(np.uint8)
    Image.fromarray(a).save(OUT + name, quality=q)

# ---------- Suelo de mármol: damero de Carrara y Nero Marquina ----------
def slab(n, dark, seed):
    y, x = np.mgrid[0:n, 0:n] / n
    r = np.random.default_rng(seed)
    w1 = fbm(n, n, 4, 2, .42, seed); w2 = fbm(n, n, 4, 3, .45, seed + 1)
    ang = r.uniform(.5, 1.1) * (1 if r.random() < .5 else -1)
    u = x * np.cos(ang) + y * np.sin(ang) + r.random()
    # vetas principales: pocas, largas y diagonales, con bordes suaves
    v1 = np.abs(np.sin((u * 1.4 + w1 * .33) * np.pi))
    v2 = np.abs(np.sin((u * 3.1 + w2 * .42 + w1 * .2) * np.pi + 1.3))
    main = np.exp(-(v1 / .035) ** 2)
    sec = np.exp(-(v2 / .02) ** 2) * (fbm(n, n, 3, 2, .5, seed + 5) > -.2)
    halo = gaussian_filter(main, n / 90)
    cloud = fbm(n, n, 7, 2, .6, seed + 3)
    fine = fbm(n, n, 3, 96, .5, seed + 4)
    vein = np.clip(main * .75 + sec * .4 + halo * .5, 0, 1)
    if not dark:
        base = np.array([238, 236, 231]) - cloud[..., None] * np.array([7, 7, 6]) - fine[..., None] * 2
        col = base - vein[..., None] * np.array([105, 102, 96])
    else:
        base = np.array([20, 20, 22]) + cloud[..., None] * 4 + fine[..., None] * 2
        col = base + vein[..., None] * np.array([175, 172, 166])
    return col, vein

T = 2048; N = 4; s = T // N; g = 4
col = np.zeros((T, T, 3)); hgt = np.zeros((T, T)); rough = np.zeros((T, T))
for i in range(N):
    for j in range(N):
        dark = (i + j) % 2 == 1
        c, v = slab(s, dark, 100 + i * 10 + j)
        col[i*s:(i+1)*s, j*s:(j+1)*s] = c
        rough[i*s:(i+1)*s, j*s:(j+1)*s] = 0.07 + v * .05 + (0.02 if dark else 0)
        hgt[i*s:(i+1)*s, j*s:(j+1)*s] = 1 + np.random.default_rng(i*9+j).normal(0, .002)
# juntas
m = np.zeros((T, T), bool)
for k in range(N + 1):
    a = k * s
    m[:, max(0, a - g//2):a + (g - g//2)] = True; m[max(0, a - g//2):a + (g - g//2), :] = True
m[:, :g//2+1] = m[:, -g//2-1:] = True; m[:g//2+1] = m[-g//2-1:] = True
col[m] = [96, 92, 86]; rough[m] = .55; hgt[m] = 0
hgt = gaussian_filter(hgt, 1.2)
save(col, "marmol_color.jpg")
save(np.dstack([rough * 0, rough * 255, rough * 0]), "marmol_rough.jpg")  # canal G = rugosidad (convención glTF)
normal_from(hgt, 2.5).save(OUT + "marmol_normal.jpg", quality=90)

# ---------- Pared: seda adamascada granate ----------
mask = np.asarray(Image.open("/tmp/claude-0/three/damask_mask.png").convert("L").resize((1024, 1536), Image.LANCZOS)) / 255.
H, W = mask.shape
yy, xx = np.mgrid[0:H, 0:W]
weave = (np.sin(xx * np.pi / 1.0) * .5 + .5) * .5 + (np.sin(yy * np.pi / 1.5) * .5 + .5) * .5
slub = fbm(H, W, 4, 24, .5, 300) * .5 + fbm(H, W, 3, 160, .5, 301) * .5
var = fbm(H, W, 5, 3, .6, 302)
sat = gaussian_filter(mask, 1.0)
base = np.array([98, 16, 24]) * (1 + var[..., None] * .05 + slub[..., None] * .035)
col = base * (1 - sat[..., None] * .0) + sat[..., None] * np.array([22, 5, 4])
save(col, "seda_color.jpg")
r = .78 - sat * .36 + slub * .03
save(np.dstack([r * 0, r * 255, r * 0]), "seda_rough.jpg")
h = weave * .35 + slub * .25 + sat * .6
normal_from(gaussian_filter(h, .6), 1.6).save(OUT + "seda_normal.jpg", quality=88)

# ---------- Techo: yeso / estuco ----------
n = 1024
p = fbm(n, n, 7, 4, .6, 400)
col = np.array([238, 232, 220]) + p[..., None] * 4
save(col, "yeso_color.jpg")
normal_from(gaussian_filter(fbm(n, n, 6, 16, .55, 401), .8), .8).save(OUT + "yeso_normal.jpg", quality=85)

# ---------- Madera de nogal (a partir de la foto de three.js, oscurecida) ----------
wd = np.asarray(Image.open("/tmp/claude-0/three/t/examples/textures/hardwood2_diffuse.jpg").convert("RGB")).astype(float)
lum = wd.mean(2, keepdims=True) / 255.
nog = np.array([70, 40, 24]) * (.55 + lum * .9)
save(nog, "nogal_color.jpg")
Image.open("/tmp/claude-0/three/t/examples/textures/hardwood2_roughness.jpg").save(OUT + "nogal_rough_src.jpg")
print("ok")
