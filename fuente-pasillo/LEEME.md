# Fuente del pasillo 3D

- `src/` — código (three.js 0.186.1). Se empaqueta en `/pasillo/app.js`:
  `npm i three@0.186.1 esbuild && npx esbuild src/app.js --bundle --format=esm --minify --outfile=../pasillo/app.js`
- `gen.py` — genera las texturas procedurales (mármol, seda adamascada, yeso, nogal) en `/pasillo/tex/`.
- Fotos de las obras: rectificadas en perspectiva a partir de `/obras/*.jpg`.
- Créditos: Tierra (NASA Blue Marble / Black Marble vía Solar System Scope, CC BY 4.0, copiadas de los ejemplos de three.js);
  cielo estrellado de los ejemplos de three.js; manos: WebXR Input Profiles (MIT, Amazon).
