#!/usr/bin/env python3
"""Genera la web a partir de datos.json.

- Optimiza las fotos (obras/) y crea miniaturas para la pared (obras/mini/)
- Inserta las obras en index.html (entre /*OBRAS*/ y /*FIN-OBRAS*/) y el índice estático
- Crea una página propia por obra en obra/<slug>/index.html
- Escribe sitemap.xml y robots.txt

Uso: python3 build.py
"""
import html, json, os, re
from datetime import date
from PIL import Image

SITIO = "https://jia-lo.github.io"
BASE = os.path.dirname(os.path.abspath(__file__))
FULL_MAX, MINI_MAX = 1400, 720

def ruta(*p): return os.path.join(BASE, *p)
def esc(t): return html.escape(str(t), quote=True)
def euro(n): return f"{n:,}".replace(",", ".") + " €"

def fotos(p):
    """Optimiza la foto grande y crea la miniatura. Devuelve tamaño de la miniatura."""
    full = ruta(p["img"])
    im = Image.open(full).convert("RGB")
    if max(im.size) > FULL_MAX:
        im.thumbnail((FULL_MAX, FULL_MAX))
        im.save(full, quality=80, optimize=True, progressive=True)
    p["w"], p["h"] = im.size
    os.makedirs(ruta("obras", "mini"), exist_ok=True)
    mini_rel = "obras/mini/" + os.path.basename(p["img"])
    mini = im.copy(); mini.thumbnail((MINI_MAX, MINI_MAX))
    mini.save(ruta(mini_rel), quality=78, optimize=True, progressive=True)
    p["thumb"], p["tw"], p["th"] = mini_rel, mini.size[0], mini.size[1]

def resumen(t, n=155):
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= n else t[: t.rfind(" ", 0, n)] + "…"

CABECERA = """<header class="top gut">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Procedencia, galería. Inicio"><span class="sello-marca" aria-hidden="true">P</span><span class="brand-txt"><b>Procedencia</b><span>Galería · Alcalá de Henares</span></span></a>
    <nav class="menu" aria-label="Secciones">
      <a href="/#sala">La sala</a><a href="/diario/">Diario</a><a href="/#como">Cómo llegan</a><a href="/#reservas">Reservas</a>
    </nav>
  </div>
</header>"""

FUENTES = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..800&family=Archivo:wdth,wght@75..100,400..700&family=IBM+Plex+Mono:wght@400;500&family=Caveat:wght@500;700&display=swap">'

def pagina_obra(p, todas):
    url = f"{SITIO}/obra/{p['slug']}/"
    img_abs = f"{SITIO}/{p['img']}"
    titulo = f"{p['t']} · Galería Procedencia"
    desc = resumen(f"{p['tech']}. {p['a']}, {p['y']}. {euro(p['price'])}. {p['story']}")
    ld = {
        "@context": "https://schema.org", "@type": "VisualArtwork",
        "name": p["t"], "url": url, "image": img_abs, "description": p["story"],
        "artMedium": p["tech"], "creditText": p["a"],
        "offers": {"@type": "Offer", "price": str(p["price"]), "priceCurrency": "EUR",
                   "availability": "https://schema.org/SoldOut" if p.get("estado") == "vendido" else "https://schema.org/InStock", "url": url},
    }
    otras = "\n".join(
        f'<li><a href="/obra/{o["slug"]}/"><img src="/{o["thumb"]}" alt="{esc(o["t"])}" width="{o["tw"]}" height="{o["th"]}" loading="lazy"><span>{esc(o["t"])} · {esc(euro(o["price"]))}</span></a></li>'
        for o in todas if o["id"] != p["id"])
    datos_js = json.dumps({k: p.get(k) for k in ("id", "slug", "t", "a", "y", "tech", "marco", "medidas", "price", "estado", "notas", "cadena", "exp", "puja")}, ensure_ascii=False)
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="product">
<meta property="og:title" content="{esc(p['t'])} · {esc(euro(p['price']))}">
<meta property="og:description" content="{esc(resumen(p['story'], 190))}">
<meta property="og:image" content="{img_abs}">
<meta property="og:image:width" content="{p['w']}">
<meta property="og:image:height" content="{p['h']}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="Galería Procedencia">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2a0b0e">
{FUENTES}
<link rel="stylesheet" href="/estilo.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
{CABECERA}
<main class="gut obra-page"><div class="wrap">
  <nav class="crumb" aria-label="Ruta"><a href="/#sala">La sala</a> / {esc(p['id'])}</nav>
  <div class="obra-grid">
    <div class="stage"><img src="/{p['img']}" alt="{esc(p['t'])}, enmarcado" width="{p['w']}" height="{p['h']}"></div>
    <div class="obra-col"><article class="cartela">
      <div class="inv"><span>{esc(p['id'])}</span><span>{esc(p['y'])}</span></div>
      <h1 style="font-family:var(--f-display);font-style:italic;font-size:clamp(1.7rem,3.2vw,2.3rem);line-height:1.04;margin:14px 0 4px;font-weight:500">{esc(p['t'])}</h1>
      <p class="art">{esc(p['a'])}</p>
      <dl>
        <div><dt>Técnica</dt><dd>{esc(p['tech'])}</dd></div>
        <div><dt>Época</dt><dd>{esc(p['y'])}</dd></div>
        <div><dt>Marco</dt><dd>{esc(p['marco'])}</dd></div>
        <div><dt>Medidas</dt><dd>{esc(p.get('medidas') or 'A consultar')}</dd></div>
      </dl>
      <p class="story">{esc(p['story'])}</p>
      <p class="hand">{esc(p['hand'])}</p>
      <div id="pujaBox"></div>
      <div class="priceline"><span class="price">{esc(euro(p['price']))}</span><span class="status {esc(p.get('estado','disponible'))}"><i></i>{ {'disponible':'Disponible','reservado':'Reservada','vendido':'Vendida'}[p.get('estado','disponible')] }</span></div>
      <div class="acts"><button class="btn" id="bRes" type="button">Reservar o preguntar</button><button class="btn ghost" id="bShare" type="button">Compartir</button><button class="btn cert-btn" id="bCert" type="button">Certificado de procedencia</button></div>
      {'<p class="hand" style="color:var(--sold)">Ya cuelga en otra casa' + (' · vendida en ' + esc(p['vendida']) if p.get('vendida') else '') + '</p>' if p.get('estado') == 'vendido' else ''}
      <a class="fichalink" href="/#sala">← Volver a la sala</a>
    </article><div id="expBox"></div></div>
  </div>
  <section class="otras" aria-labelledby="otrasT"><h2 id="otrasT">Más obras en la sala</h2><ul>
{otras}
  </ul></section>
</div></main>
<footer class="gut"><div class="wrap"><div class="sign" style="margin-top:0"><b>Procedencia</b><span>Obra con historia · Alcalá de Henares</span></div></div></footer>
<script src="/contacto.js"></script>
<script src="/ficha.js"></script>
<script src="/luz.js"></script>
<script>
const P = {datos_js};
document.getElementById("expBox").innerHTML = htmlExpediente(P); ponerExpediente(document);
const PJ = (P.estado || "disponible") === "disponible" ? estadoPuja(P) : null;
if (PJ) {{
  document.getElementById("pujaBox").innerHTML = htmlPuja(P);
  document.querySelector(".priceline .price").innerHTML = `<small>${{pujaActual(P) == null ? "Salida" : "Puja actual"}}</small> ${{euro(pujaActual(P) == null ? P.puja.salida : pujaActual(P))}}`;
  const st = document.querySelector(".priceline .status"); st.className = "status en-puja"; st.innerHTML = `<i></i>${{PJ.abierta ? "En puja" : "Puja cerrada"}}`;
  document.getElementById("bRes").textContent = PJ.abierta ? `Pujar · desde ${{euro(minimoPuja(P))}}` : "Preguntar por esta obra";
  tickRelojes();
}}
ponerLupa(document.querySelector(".obra-grid .stage"), P);
document.getElementById("bCert").onclick = () => abrirCertificado(P);
document.getElementById("bRes").onclick = () => PJ && PJ.abierta ? ofertar(P) : reservar(P);
document.getElementById("bShare").onclick = () => compartir(P);
</script>
</body>
</html>
"""

def main():
    obras = json.load(open(ruta("datos.json"), encoding="utf-8"))
    # Pujas reales recibidas y confirmadas por la galería (pujas.json); la salida es 20 € menos que el precio
    pujas = json.load(open(ruta("pujas.json"), encoding="utf-8")) if os.path.exists(ruta("pujas.json")) else {}
    for p in obras:
        if p.get("puja"):
            p["puja"]["salida"] = p["puja"].get("salida") or p["price"] - 20
            p["puja"]["incremento"] = p["puja"].get("incremento", 5)
            p["puja"]["pujas"] = pujas.get(p["id"], [])
    for p in obras: fotos(p)

    # Portada: datos de las obras e índice estático
    idx = open(ruta("index.html"), encoding="utf-8").read()
    campos = ("id", "slug", "img", "thumb", "tw", "th", "estado", "modo", "vendida", "notas", "cadena", "gabinete", "exp", "puja", "t", "a", "y", "tech", "marco", "medidas", "story", "hand", "price")
    sala = [p for p in obras if not p.get("gabinete")]
    gabinete = [p for p in obras if p.get("gabinete")]
    data = json.dumps([{k: p[k] for k in campos if k in p} for p in sala], ensure_ascii=False)
    gdata = json.dumps([{k: p[k] for k in campos if k in p} for p in gabinete], ensure_ascii=False)
    idx = re.sub(r"/\*OBRAS\*/.*?/\*FIN-OBRAS\*/", lambda m: f"/*OBRAS*/{data}/*FIN-OBRAS*/", idx, flags=re.S)
    idx = re.sub(r"/\*GABINETE\*/.*?/\*FIN-GABINETE\*/", lambda m: f"/*GABINETE*/{gdata}/*FIN-GABINETE*/", idx, flags=re.S)
    lista = "<ul>\n" + "\n".join(
        f'<li><a href="/obra/{p["slug"]}/"><b>{esc(p["t"])}</b><span>{esc(euro(p["price"]))}</span></a></li>' for p in sala) + "\n</ul>"
    idx = re.sub(r"<!--INDICE-->.*?<!--/INDICE-->", lambda m: f"<!--INDICE-->\n{lista}\n<!--/INDICE-->", idx, flags=re.S)
    # Diario de la galería
    import diario
    durls, adelanto = diario.construir(BASE, SITIO, CABECERA, FUENTES, sala)
    idx = re.sub(r"<!--DIARIO-->.*?<!--/DIARIO-->", lambda m: f"<!--DIARIO-->\n{adelanto}\n<!--/DIARIO-->", idx, flags=re.S)
    open(ruta("index.html"), "w", encoding="utf-8").write(idx)

    # Páginas de cada obra
    for p in sala:
        os.makedirs(ruta("obra", p["slug"]), exist_ok=True)
        open(ruta("obra", p["slug"], "index.html"), "w", encoding="utf-8").write(pagina_obra(p, sala))

    # Sitemap y robots
    hoy = date.today().isoformat()
    urls = [f"{SITIO}/"] + [f"{SITIO}/obra/{p['slug']}/" for p in sala] + [SITIO + u for u in durls]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
         "".join(f"  <url><loc>{u}</loc><lastmod>{hoy}</lastmod></url>\n" for u in urls) + "</urlset>\n"
    open(ruta("sitemap.xml"), "w").write(sm)
    open(ruta("robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {SITIO}/sitemap.xml\n")
    print(f"{len(obras)} obras · {len(urls)} páginas en el sitemap")

if __name__ == "__main__":
    main()
