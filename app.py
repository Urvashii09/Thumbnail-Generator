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

def generate_slide_image_helper(slide, theme, consistency_note, bg_custom_prompt, aspect_ratio, logo_base64=None):
    """Reusable helper for generating a single slide image."""
    base_prompt = slide.get('image_prompt', '')
    final_prompt = f"{base_prompt}. Style: {theme}, {consistency_note}. {bg_custom_prompt}. "
    final_prompt += "CRITICAL: NO TEXT, NO WORDS, NO LETTERS. HIGH QUALITY CINEMATIC BACKGROUND PLATE."

    try:
        image_response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=final_prompt,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio
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
                    img_data = f"data:{mime};base64,{encoded_image}"
                    
                    if logo_base64:
                        img_data = composite_logo(img_data, logo_base64)
                    return img_data
        return None
    except Exception as e:
        print(f"Error generating slide image: {e}")
        return None

@app.route('/api/generate_slide', methods=['POST'])
def generate_slide():
    data = request.json
    topic = data.get('topic')
    slide_number = data.get('slideNumber', 1)
    theme = data.get('theme', 'Aesthetic')
    aspect_ratio = data.get('aspectRatio', '1:1')
    logo_base64 = data.get('logoBase64', None)
    
    gen_image = data.get('genImage', True)
    
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is missing."}), 500

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    prompt = f"""
    You are a professional social media designer. 
    Generate a catchy heading and subtext for Slide #{slide_number} of a carousel about "{topic}".
    The overall visual theme is: {theme}.
    
    CRITICAL: 
    - NO MARKDOWN. 
    - NO BOLDING (**). 
    - NO SPECIAL CHARACTERS.
    - Return plain, natural, impactful text.
    
    OUTPUT FORMAT:
    Return ONLY a JSON object with: 
    "heading" (impactful, max 5 words), 
    "subtext" (informative, max 15 words), 
    "image_prompt" (detailed artistic description for a background plate, NO text).
    """
    
    try:
        response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        text_response = response.text.strip()
        if text_response.startswith("```json"): text_response = text_response[7:-3]
        
        slide_data = json.loads(text_response)
        
        # Generate image only if requested
        if gen_image:
            img_data = generate_slide_image_helper(
                slide_data, theme, "Single slide generation", "", aspect_ratio, logo_base64
            )
            slide_data['generated_image_base64'] = img_data
        else:
            slide_data['generated_image_base64'] = data.get('currentImage')
            
        return jsonify(slide_data)
    except Exception as e:
        print(f"Error in single slide generation: {e}")
        return jsonify({"error": str(e)}), 500


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
        target_prompt = concept_data.get("image_prompt", "")
        image_prompt = f"{target_prompt} CRITICAL INSTRUCTION: There must be ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, and NO CHARACTERS anywhere in this image. Do not add any UI elements or logos. Generate ONLY a highly detailed background plate."
        
        try:
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
        except Exception as e:
            print(f"Error generating image: {e}")
            raise e

    try:
        # We must generate text first to get the image_prompt
        concept_data = generate_text()
        
        try:
            # Now generate image using the new image_prompt
            img_data = generate_image(concept_data)
            
            # Apply logo composite if provided
            if logo_base64:
                img_data = composite_logo(img_data, logo_base64)
                
            concept_data["generated_image_base64"] = img_data
        except Exception as img_err:
            print(f"Error generating image: {img_err}")
            concept_data["image_error"] = f"Failed to generate thumbnail image due to API error: {img_err}"
            
        return jsonify(concept_data)
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({"error": "Failed to generate concept. Please check server logs and API Key."}), 500

@app.route('/api/generate_carousel', methods=['POST'])
def generate_carousel():
    data = request.json
    topic = data.get('topic')
    theme = data.get('theme', 'Aesthetic')
    audience = data.get('audience', 'General')
    logo_base64 = data.get('logoBase64', None)
    aspect_ratio = data.get('aspectRatio', '1:1')
    
    # New parameters
    num_slides = data.get('numSlides', 5)
    content_mode = data.get('contentMode', 'ai')
    manual_text = data.get('manualText', '')
    bg_mode = data.get('bgMode', 'image')
    bg_custom_prompt = data.get('bgCustomPrompt', '')
    include_elements = data.get('elements', {})
    
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is missing."}), 500

    if not topic and content_mode == 'ai':
        return jsonify({"error": "Topic is required for AI mode"}), 400

    def generate_carousel_structure():
        elements_str = ", ".join([k for k, v in include_elements.items() if v])
        bg_instruction = "Generate artistic, detailed background prompts." if bg_mode == 'image' else "Generate minimalist, clean, and abstract background prompts with lots of negative space."
        
        if content_mode == 'manual':
            prompt = f"""
You are a world-class visual designer. I have manually written the text for an Instagram carousel.
Your task is to take this text and generate a corresponding visual concept and individual image prompts for each slide to ensure a professional and consistent look.

INPUT TEXT:
{manual_text}

NUMBER OF SLIDES: {num_slides}
VISUAL THEME: {theme}
BG STYLE: {bg_mode} ({bg_instruction})
CUSTOM STYLE PROMPT: {bg_custom_prompt}
DECORATIVE ELEMENTS TO INCLUDE: {elements_str}

INSTRUCTIONS:
1. For each slide provided in the input, create a highly specific 'image_prompt' for an AI image generator.
2. Ensure all slide image prompts share a unified color palette, lighting, and artistic style based on the theme: {theme}.
3. The image prompts should focus on background plates ONLY (No text).
4. If 'arrows' are requested, describe subtle directional flow or geometric indicators in the background.

OUTPUT FORMAT:
Return a JSON object with:
- "visual_consistency_note": A brief description of the shared visual style.
- "slides": An array of objects, each with: "slide_number", "heading", "subtext", and "image_prompt".
(Use the original heading and subtext from the input).
            """
        else:
            prompt = f"""
You are a world-class social media strategist and visual designer.
Generate a high-converting Instagram carousel structure for the topic: "{topic}".

NUMBER OF SLIDES: {num_slides}
TARGET AUDIENCE: {audience}
VISUAL THEME: {theme}
BG STYLE: {bg_mode} ({bg_instruction})
CUSTOM STYLE PROMPT: {bg_custom_prompt}
DECORATIVE ELEMENTS TO INCLUDE: {elements_str}

OUTPUT FORMAT:
Return a JSON object with:
- "visual_consistency_note": A brief description of the shared visual style.
- "slides": An array of {num_slides} objects, each with: "slide_number", "heading" (catchy, max 5 words), "subtext" (valuable, max 15 words), and "image_prompt" (highly detailed description for an AI generator, focusing on consistent background art with NO TEXT).
            """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        try:
            return json.loads(text_response)
        except Exception as e:
            raise ValueError(f"Failed to parse carousel structure: {e}")

    def generate_slide_image(slide, consistency_note):
        # We used the prompt generated by the text model
        base_prompt = slide.get('image_prompt', '')
        
        # Add visual theme constraints
        final_prompt = f"{base_prompt}. Style: {theme}, {consistency_note}. {bg_custom_prompt}. "
        final_prompt += "CRITICAL: NO TEXT, NO WORDS, NO LETTERS. HIGH QUALITY CINEMATIC BACKGROUND PLATE."

        try:
            image_response = client.models.generate_content(
                model="gemini-3.1-flash-image-preview",
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(
                        aspect_ratio=aspect_ratio
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
                        img_data = f"data:{mime};base64,{encoded_image}"
                        
                        # Apply logo if provided
                        if logo_base64:
                            img_data = composite_logo(img_data, logo_base64)
                        
                        return img_data
            return None
        except Exception as e:
            print(f"Error generating slide image: {e}")
            return None

    try:
        carousel_structure = generate_carousel_structure()
        slides = carousel_structure.get('slides', [])
        consistency_note = carousel_structure.get('visual_consistency_note', '')

        # Use ThreadPoolExecutor for parallel generation
        with concurrent.futures.ThreadPoolExecutor(max_workers=7) as executor:
            future_to_slide = {executor.submit(generate_slide_image, slide, consistency_note): slide for slide in slides}
            for future in concurrent.futures.as_completed(future_to_slide):
                slide = future_to_slide[future]
                try:
                    img_base64 = future.result()
                    slide['generated_image_base64'] = img_base64
                except Exception as exc:
                    print(f"Slide {slide.get('slide_number')} generated an exception: {exc}")
                    slide['generated_image_base64'] = None

        return jsonify(carousel_structure)
    except Exception as e:
        print(f"Error generating carousel: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
