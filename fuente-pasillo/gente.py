# Une las dos capturas de cada visitante, quita el fondo y lo deja listo como recorte con transparencia
import sys
from PIL import Image, ImageFilter, ImageEnhance
from rembg import remove, new_session
ses = new_session('isnet-general-use')
for n in sys.argv[1:]:
    a = Image.open(f'/home/claude/ia/{n}_a.png').convert('RGB'); b = Image.open(f'/home/claude/ia/{n}_b.png').convert('RGB')
    full = Image.new('RGB', (768, 1344)); full.paste(b, (0, 657)); full.paste(a.crop((0, 0, 768, 670)), (0, 0))
    full.save(f'/home/claude/ia/{n}_full.png')
    cut = remove(full, session=ses, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=20, alpha_matting_erode_size=8)
    bb = cut.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    cut = cut.crop((bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 2))
    # suelo: los pies tocan el borde inferior
    h = 1024; w = round(cut.width * h / cut.height)
    cut = cut.resize((w, h), Image.LANCZOS)
    cut.save(f'/home/claude/site/pasillo/gente/{n}.webp', quality=88, method=6)
    print(n, cut.size)
