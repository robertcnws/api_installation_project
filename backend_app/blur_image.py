from PIL import Image, ImageFilter, ImageDraw

# Reemplaza 'original.png' con el nombre de tu archivo de imagen
input_image_path = 'C:\\Users\\nws20\\Downloads\\customer_details_match.png'
output_image_path = 'C:\\Users\\nws20\\Downloads\\customer_details_match_blurred.png'

# Coordenadas aproximadas de las áreas a difuminar
# (x1, y1, x2, y2) en píxeles
# Deberás ajustarlas manualmente según la posición del texto en tu imagen
blur_regions = [
    (100, 200, 300, 220),  # ejemplo: región del nombre
    (100, 250, 300, 270),  # ejemplo: región del email
    (100, 300, 300, 320),  # ejemplo: región del teléfono
]

# Abre la imagen
image = Image.open(input_image_path)

# Para cada región que quieras difuminar:
for region in blur_regions:
    # Extrae la sub-imagen
    crop_area = image.crop(region)
    # Aplica desenfoque
    blurred_crop = crop_area.filter(ImageFilter.GaussianBlur(radius=10))
    # Pega la sub-imagen desenfocada de nuevo en la imagen original
    image.paste(blurred_crop, region)

# Guarda la imagen resultante
image.save(output_image_path)

print("Imagen procesada y guardada como:", output_image_path)
