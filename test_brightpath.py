from google import genai
import PIL.Image
import os
from dotenv import load_dotenv

# Load API key
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ ERROR: API key not found!")
    exit()

# Configure Gemini
client = genai.Client(api_key=api_key)

# Enhanced system prompt
system_prompt = """
You are BrightPath, an AI assistant for blind people.
Describe this item clearly and helpfully:

1. WHAT: What is the item?
2. LOOKS: Color, shape, size
3. PURPOSE: What is it used for?
4. TEXT: Read any text on it
5. SAFETY: Any warnings?

Keep it short and clear. Start with "I see a..."
"""

def describe_item(image_path):
    try:
        img = PIL.Image.open(image_path)
        
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[system_prompt, img]
        )
        
        return response.text
    except FileNotFoundError:
        return f"❌ Error: Image '{image_path}' not found."
    except Exception as e:
        return f"❌ Error: {e}"

if __name__ == "__main__":
    print("\n🌟 BRIGHTPATH - AI Assistant for the Blind")
    print("=" * 50)
    
    image_path = input("\n📷 Enter image filename: ")
    print("\n⏳ Analyzing...")
    
    result = describe_item(image_path)
    print("\n📝 DESCRIPTION:")
    print(result)
    print("\n" + "=" * 50)