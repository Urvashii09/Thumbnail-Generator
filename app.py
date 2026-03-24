import os
import json
import base64
import io
import concurrent.futures
from flask import Flask, request, jsonify, render_template
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[WARN] GEMINI_API_KEY is not set. You must set this in production environment variables.")
    client = None
else:
    client = genai.Client(api_key=GEMINI_API_KEY)

@app.route('/')
def index():
    return render_template('index.html')

def composite_logo(background_base64, logo_base64):
    """Composites a logo onto the bottom right of the background image."""
    try:
        # Decode images
        bg_bytes = base64.b64decode(background_base64.split(",")[1] if "," in background_base64 else background_base64)
        logo_bytes = base64.b64decode(logo_base64.split(",")[1] if "," in logo_base64 else logo_base64)
        
        bg = Image.open(io.BytesIO(bg_bytes)).convert("RGBA")
        logo = Image.open(io.BytesIO(logo_bytes)).convert("RGBA")
        
        # Calculate new logo size (max 20% of background width/height)
        max_logo_w = int(bg.width * 0.20)
        max_logo_h = int(bg.height * 0.20)
        
        logo.thumbnail((max_logo_w, max_logo_h), Image.Resampling.LANCZOS)
        
        # Calculate position (Bottom Right with padding)
        padding = int(bg.width * 0.05)
        pos_x = bg.width - logo.width - padding
        pos_y = bg.height - logo.height - padding
        
        # Paste logo using alpha channel as mask
        bg.alpha_composite(logo, dest=(pos_x, pos_y))
        
        # Convert back to RGB for JPEG save
        bg = bg.convert("RGB")
        
        # Save to buffer
        buffer = io.BytesIO()
        bg.save(buffer, format="JPEG", quality=95)
        composited_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{composited_b64}"
    except Exception as e:
        print(f"Error compositing logo: {e}")
        return background_base64 # Return original if failed

@app.route('/api/generate_concept', methods=['POST'])
def generate_concept():
    data = request.json
    topic = data.get('topic')
    theme = data.get('theme', 'Aesthetic')
    audience = data.get('audience', 'General')
    platform = data.get('platform', 'Any')
    logo_base64 = data.get('logoBase64', None)
    
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is missing. Set it in Vercel Environment Variables."}), 500

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    def generate_text():
        prompt = f"""
You are a world-class visual designer, creative director, and marketing strategist.

Your task is to generate a highly engaging thumbnail or visual concept that instantly grabs attention and communicates the core idea within 1–2 seconds.
The design should work for any type of content such as videos, blogs, advertisements, social media posts, courses, presentations, or websites.

INPUT:
Content Topic: {topic}
Visual Theme: {theme}
Target Audience: {audience}
Platform: {platform}

INSTRUCTIONS:
Create a modern, visually striking concept that is attention-grabbing, clear, and emotionally engaging.

Focus on:
• Strong visual storytelling
• One clear focal point
• High contrast colors
• Minimal but powerful elements
• Curiosity and emotional impact
• Modern, professional design aesthetics
• Easy readability even on small screens

OUTPUT FORMAT:
Provide the output in a structured JSON format with EXACTLY these 10 keys:

1. "visual_concept": Describe the main scene and overall creative idea.
2. "main_subject": The primary object, character, or focus element.
3. "background_scene": Environment or setting that enhances the story.
4. "emotion_action": What emotion or action should be visible to attract attention.
5. "color_palette": Suggest bold colors that create strong visual contrast (Array of 3-4 hex codes).
6. "lighting_style": Example: cinematic, dramatic, neon, futuristic, natural.
7. "composition": Example: close-up, split-screen, wide angle, top view, dynamic perspective.
8. "text_overlay": Provide a short powerful phrase (3–5 words maximum).
9. "viral_hook": Explain why this design would attract viewers and make them curious.
10. "image_prompt": Generate a detailed, professional prompt optimized for AI image generators like Midjourney, Stable Diffusion, or DALL-E. The prompt should describe the scene, lighting, colors, style, and composition clearly to produce a cinematic, high-quality image. CRITICAL: Specify NO TEXT, NO WORDS in the generated image.

Format the response as pure JSON only. Do not wrap it in markdown codeblocks like ```json ```.
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        if not response or not getattr(response, 'text', None):
            raise ValueError('Gemini text response is empty')

        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]

        try:
            return json.loads(text_response)
        except json.JSONDecodeError as json_err:
            raise ValueError(f"Failed decoding JSON concept response: {json_err} - payload={text_response}")

    def generate_image(concept_data):
        # We now use the exact image_prompt generated by the expert text model.
        # We append a forceful constraint against text generation.
        target_prompt = concept_data.get("image_prompt", "")
        
        image_prompt = f"{target_prompt} CRITICAL INSTRUCTION: There must be ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, and NO CHARACTERS anywhere in this image. Do not add any UI elements or logos. Generate ONLY a highly detailed background plate."
        
        image_response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=image_prompt,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio="16:9"
                )
            )
        )
        
        if getattr(image_response, 'candidates', None):
            first = image_response.candidates[0]
            parts = getattr(first.content, 'parts', None)
            if parts:
                part = parts[0]
                inline = getattr(part, 'inline_data', None)
                if inline and getattr(inline, 'data', None):
                    image_bytes = inline.data
                    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
                    mime = getattr(inline, 'mime_type', '') or 'image/jpeg'
                    return f"data:{mime};base64,{encoded_image}"
        raise ValueError("No image data returned")

@app.route('/api/generate_carousel', methods=['POST'])
def generate_carousel():
    data = request.json
    topic = data.get('topic')
    theme = data.get('theme', 'Aesthetic')
    audience = data.get('audience', 'General')
    logo_base64 = data.get('logoBase64', None)
    aspect_ratio = data.get('aspectRatio', '1:1')
    
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is missing."}), 500

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    def generate_carousel_text():
        prompt = f"""
You are a world-class social media strategist and visual designer specializing in Instagram carousels.

Your task is to generate a highly engaging 5–7 slide carousel post based on the topic: "{topic}".
The carousel should tell a story, provide value, or teach something in a catchy, visual-first way.

INPUT:
Topic: {topic}
Visual Theme: {theme}
Target Audience: {audience}

INSTRUCTIONS:
1. Generate 5–7 slides that follow a logical progression (Hook -> Value -> Call to Action).
2. Each slide must have a "heading" (max 5 words) and a "subtext" (max 12 words).
3. Suggest a consistent "color_palette" (3-4 hex codes) and "lighting_style" for the entire carousel.
4. For EACH slide, generate a detailed "image_prompt" for an AI image generator. 
   - Maintain visual consistency across all slides (same characters, style, or environment).
   - Specify NO TEXT in the generated images.
   - The images should be cinematic and high quality.

OUTPUT FORMAT:
Provide the output in a structured JSON format with these exact keys:
{{
  "slides": [
    {{
      "slide_number": 1,
      "heading": "...",
      "subtext": "...",
      "image_prompt": "..."
    }},
    ...
  ],
  "color_palette": ["#...", "#...", ...],
  "lighting_style": "...",
  "visual_consistency_note": "How to keep it consistent"
}}

Format the response as pure JSON only. Do not wrap it in markdown codeblocks like ```json ```.
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        text_response = response.text.strip()
        if text_response.startswith("```json"): text_response = text_response[7:]
        if text_response.endswith("```"): text_response = text_response[:-3]
        return json.loads(text_response)

    def generate_single_slide_image(slide, aspect_ratio):
        target_prompt = slide.get("image_prompt", "")
        full_prompt = f"{target_prompt} CRITICAL: ABSOLUTELY NO TEXT, NO WORDS. High quality, cinematic background art."
        
        try:
            image_response = client.models.generate_content(
                model="gemini-3.1-flash-image-preview",
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(aspect_ratio=aspect_ratio)
                )
            )
            
            if getattr(image_response, 'candidates', None):
                first = image_response.candidates[0]
                parts = getattr(first.content, 'parts', None)
                if parts:
                    inline = getattr(parts[0], 'inline_data', None)
                    if inline and getattr(inline, 'data', None):
                        img_b64 = base64.b64encode(inline.data).decode('utf-8')
                        mime = getattr(inline, 'mime_type', 'image/jpeg')
                        return f"data:{mime};base64,{img_b64}"
        except Exception as e:
            print(f"Error generating slide {slide['slide_number']}: {e}")
        return None

    try:
        carousel_data = generate_carousel_text()
        slides = carousel_data.get("slides", [])
        
        # Parallel image generation
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(slides)) as executor:
            future_to_slide = {executor.submit(generate_single_slide_image, s, aspect_ratio): s for s in slides}
            
            for future in concurrent.futures.as_completed(future_to_slide):
                slide = future_to_slide[future]
                try:
                    img_data = future.result()
                    if img_data and logo_base64:
                        img_data = composite_logo(img_data, logo_base64)
                    slide["generated_image_base64"] = img_data
                except Exception as e:
                    print(f"Slide generation failed: {e}")
                    slide["generated_image_base64"] = None

        return jsonify(carousel_data)
    except Exception as e:
        print(f"Carousel Error: {e}")
        return jsonify({"error": f"Failed to generate carousel: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
