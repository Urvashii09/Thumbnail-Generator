from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyBZ7fvgBgVTzyjgrmTMx5XYKttXPHWYrBA")

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="Create a realistic sunset over mountains",
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="1:1"
        )
    )
)

# Attempt to save first image candidate to file
saved = False
if getattr(response, 'candidates', None):
    first = response.candidates[0]
    parts = getattr(first.content, 'parts', None)
    if parts:
        part = parts[0]
        inline = getattr(part, 'inline_data', None)
        if inline and getattr(inline, 'data', None):
            data = inline.data
            mime = getattr(inline, 'mime_type', '') or 'image/png'
            ext = 'png' if 'png' in mime else 'jpg'
            out_path = f'generated_image.{ext}'
            with open(out_path, 'wb') as f:
                f.write(data)
            print(f"Saved image to {out_path}")
            saved = True

if not saved:
    print(response)