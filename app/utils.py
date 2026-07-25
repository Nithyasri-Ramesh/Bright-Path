from google import genai
import PIL.Image
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Create Gemini client
client = genai.Client(api_key=api_key)

# System Prompt
SYSTEM_PROMPT = """
You are BrightPath, an AI assistant for blind and visually impaired people.

Describe the uploaded image in a clear, natural, spoken-friendly way.

Follow this structure:

1. WHAT: Identify the main object(s).
2. DETAILS: Mention color, shape, size, and important visual features.
3. PURPOSE: Explain what it is used for.
4. TEXT: Read any visible text.
5. SAFETY: Mention any hazards or warnings if applicable.

Rules:
- Keep the response concise (2–4 short sentences).
- Speak naturally as if talking to a blind person.
- If you are uncertain, clearly say so instead of guessing.
- Begin the response with "I see..."
"""

def describe_item_with_gemini(image_path):
    """
    Analyze an image using Gemini 2.5 Flash and return a description.
    """
    try:
        img = PIL.Image.open(image_path)

        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[
                SYSTEM_PROMPT,
                img
            ]
        )

        return response.text

    except FileNotFoundError:
        return f"Error: Image '{image_path}' not found."

    except Exception as e:
        return f"Error analyzing image: {str(e)}"