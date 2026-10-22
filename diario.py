"""Diario de la galería: un cuaderno por vaciado y varias hojas por cuaderno (datos en diario.json)."""
import html, json, os

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

def esc(t): return html.escape(str(t), quote=True)

def fecha_larga(iso):
    from datetime import date
    y, m, d = map(int, iso.split("-"))
    return f"{DIAS[date(y, m, d).weekday()]} {d} de {MESES[m - 1]} de {y}"

def hojas_ordenadas(diario):
    todas = []
    for c in diario["cuadernos"]:
        for i, h in enumerate(c["hojas"]):
            todas.append((c, i, h))
    return sorted(todas, key=lambda x: x[2]["fecha"], reverse=True)

def url_hoja(c, h): return f"/diario/{c['slug']}/{h['slug']}/"

def tarjeta(c, h, n):
    return f'''<a class="hoja-card" href="{url_hoja(c, h)}">
      <span class="hc-k">Cuaderno de {esc(c["titulo"])} · hoja {n}</span>
      <b>{esc(h["titulo"])}</b>
      <span class="hc-f">{esc(fecha_larga(h["fecha"]))} · {esc(h["lugar"])}</span>
      <span class="hc-x">{esc(h["cuerpo"][0][:150].rsplit(" ", 1)[0])}…</span>
    </a>'''

def pagina(titulo, desc, url, cuerpo, cab, fuentes, sitio, extra_head=""):
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{sitio}{url}">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{sitio}{url}">
<meta property="og:image" content="{sitio}/obras/montacute.jpg">
<meta name="theme-color" content="#2a0b0e">
{fuentes}
<link rel="stylesheet" href="/estilo.css">
{extra_head}
</head>
<body>
{cab}
<main class="gut diario-page"><div class="wrap">
{cuerpo}
</div></main>
<footer class="gut"><div class="wrap"><div class="sign" style="margin-top:0"><b>Procedencia</b><span>Obra con historia · Alcalá de Henares</span></div></div></footer>
<script src="/luz.js"></script>
<script src="/presencia.js"></script>
</body>
</html>
"""

def construir(base, sitio, cab, fuentes, obras):
    diario = json.load(open(os.path.join(base, "diario.json"), encoding="utf-8"))
    por_id = {o["id"]: o for o in obras}
    urls = ["/diario/"]
    todas = hojas_ordenadas(diario)

    # Índice del diario
    bloques = []
    for c in diario["cuadernos"]:
        hojas = "\n".join(tarjeta(c, h, i + 1) for i, h in enumerate(c["hojas"]))
        bloques.append(f'''<section class="cuaderno">
      <header class="cu-head"><span class="cu-k">Cuaderno · visita del {esc(fecha_larga(c["visita"]))}</span>
      <h2>{esc(c["titulo"])}</h2><p>{esc(c["subtitulo"])}</p></header>
      <div class="hojas">{hojas}</div>
    </section>''')
    cuerpo = f'''<header class="diario-head"><div class="eyebrow">Diario de la galería</div>
      <h1>Cuadernos <em>de vaciado</em></h1>
      <p>Cada vaciado tiene su cuaderno: cómo era la casa, su estilo, lo que había dentro y lo que acabó viniendo a la sala. Sin direcciones: las casas son de familias y su intimidad se respeta.</p></header>
      {"".join(bloques)}'''
    os.makedirs(os.path.join(base, "diario"), exist_ok=True)
    open(os.path.join(base, "diario", "index.html"), "w", encoding="utf-8").write(
        pagina("Diario de la galería · Procedencia", "Cuadernos de los vaciados donde se encuentran las obras de la Galería Procedencia: las casas, su estilo y lo que había dentro.", "/diario/", cuerpo, cab, fuentes, sitio))

    # Hojas
    for c in diario["cuadernos"]:
        for i, h in enumerate(c["hojas"]):
            url = url_hoja(c, h); urls.append(url)
            prev = c["hojas"][i - 1] if i > 0 else None
            sig = c["hojas"][i + 1] if i + 1 < len(c["hojas"]) else None
            parrafos = "\n".join(f"<p>{esc(t)}</p>" for t in h["cuerpo"])
            margen = "".join(f"<li>{esc(t)}</li>" for t in h.get("margen", []))
            traidas = [por_id[x] for x in h.get("obras", []) if x in por_id]
            obras_html = ""
            if traidas:
                obras_html = '<div class="hoja-obras"><h3>Lo que vino a la sala</h3><ul>' + "".join(
                    f'<li><a href="/obra/{o["slug"]}/"><img src="/{o["thumb"]}" alt="" width="{o["tw"]}" height="{o["th"]}" loading="lazy"><span>{esc(o["t"])}</span></a></li>' for o in traidas) + "</ul></div>"
            nav = '<nav class="hoja-nav" aria-label="Hojas del cuaderno">' + \
                (f'<a href="{url_hoja(c, prev)}">← {esc(prev["titulo"])}</a>' if prev else '<span></span>') + \
                (f'<a href="{url_hoja(c, sig)}">{esc(sig["titulo"])} →</a>' if sig else '<span class="pronto">Próxima hoja, después de la visita</span>') + "</nav>"
            cuerpo = f'''<nav class="crumb" aria-label="Ruta"><a href="/diario/">Diario</a> / {esc(c["titulo"])}</nav>
      <article class="hoja-diario">
        <div class="hoja-papel">
          <p class="hoja-k">Cuaderno de {esc(c["titulo"])} · hoja {i + 1}</p>
          <h1>{esc(h["titulo"])}</h1>
          <p class="hoja-f">{esc(fecha_larga(h["fecha"]))} · {esc(h["lugar"])}</p>
          <div class="hoja-txt">{parrafos}</div>
          {obras_html}
        </div>
        {f'<ul class="margen" aria-label="Notas al margen">{margen}</ul>' if margen else ""}
      </article>
      {nav}'''
            ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": h["titulo"], "datePublished": h["fecha"],
                  "author": {"@type": "Organization", "name": "Galería Procedencia"}, "url": sitio + url}
            os.makedirs(os.path.join(base, url.strip("/")), exist_ok=True)
            open(os.path.join(base, url.strip("/"), "index.html"), "w", encoding="utf-8").write(
                pagina(f"{h['titulo']} · Diario de la galería", h["cuerpo"][0][:155], url, cuerpo, cab, fuentes, sitio,
                       f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'))

    # Adelanto para la portada: las dos hojas más recientes
    adelanto = "\n".join(tarjeta(c, h, i + 1) for c, i, h in todas[:2])
    return urls, adelanto
