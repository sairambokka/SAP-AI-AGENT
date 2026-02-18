import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hana_connector import fetch_data_from_hana

# Load environment variables
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:3000")

def get_materials():
    """
    Fetch material master data.
    """
    try:
        response = requests.get(f"{API_BASE_URL}/materials")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def get_materials_from_hana():
    """
    Fetch materials directly from SAP HANA database.
    Note: You may need to adjust the table name 'MATERIALS' to match your actual schema.
    """
    print("Attempting to fetch materials from SAP HANA...")
    # Example query - replace 'MATERIALS' with your actual table name if different
    query = 'SELECT "Material", "Description", "Plant", "CurrentGroup" FROM MATERIAL_MASTER'
    return fetch_data_from_hana(query)

SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "system-prompts", "system-prompt-2.txt")

def load_system_prompt():
    with open(SYSTEM_PROMPT_PATH, "r") as f:
        return f.read()

def analyze_data(data):
    """
    Analyzes the provided data using the system prompt stored in the repo.
    """
    system_prompt = load_system_prompt()
    
    # Convert data to string (JSON dump)
    data_str = json.dumps(data, indent=2, default=str)
    
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the material data to classify:\n{data_str}"}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        raw = completion.choices[0].message.content
        return json.loads(raw)
    except Exception as e:
        return f"Error during analysis: {str(e)}"

def main():
    print("--- SAP Material Intelligence Agent ---")
    
    # Check API availability
    try:
        requests.get(API_BASE_URL)
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to API at {API_BASE_URL}.")
        print("Please ensure your Express JS API is running.")
    else:
        print("API is available.")

    # Check for HANA connection context
    hana_available = False
    if os.getenv("HANA_ADDRESS"):
        print("\n--- Checking SAP HANA Connection ---")
        hana_test = fetch_data_from_hana("SELECT * FROM DUMMY")
        if isinstance(hana_test, list):
            print("Successfully connected to SAP HANA!")
            hana_available = True
        else:
            print(f"SAP HANA Connection failed: {hana_test}")

    materials_data = []
    
    # Try fetching from API first
    print("\n1. Fetching Materials...")
    api_data = get_materials()
    
    if isinstance(api_data, list) and api_data:
        materials_data = api_data
        print(f"   Retrieved {len(materials_data)} materials from API.")
    elif hana_available:
        # Fallback to HANA or prefer HANA if API failed
        print("   API materials not found or error. Trying SAP HANA...")
        hana_data = get_materials_from_hana()
        if isinstance(hana_data, list):
            materials_data = hana_data
            print(f"   Retrieved {len(materials_data)} materials from SAP HANA.")
        else:
             print(f"   Error fetching from HANA: {hana_data}")
    
    if not materials_data:
        if isinstance(api_data, dict) and "error" in api_data:
             print(f"   API Error: {api_data['error']}")
        print("   No materials found from any source to analyze.")
        return

    # Data Cleaning (Minimal for now, can be expanded based on actual data shape)
    print("2. Cleaning data...")
    cleaned_materials = []
    for item in materials_data:
        cleaned_item = item.copy()
        for key, value in cleaned_item.items():
            if isinstance(value, str):
                cleaned_item[key] = value.strip()
        cleaned_materials.append(cleaned_item)

    print("3. Analyzing data with AI...")
    analysis_result = analyze_data(cleaned_materials)
    
    print("\n--- Analysis Result ---")
    if isinstance(analysis_result, dict):
        print(json.dumps(analysis_result, indent=2, default=str))
    else:
        print(analysis_result)
    print("-----------------------")

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not set. Please set it in your .env file or environment.")
    else:
        main()
