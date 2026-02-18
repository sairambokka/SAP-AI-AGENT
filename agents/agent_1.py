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

def get_orders(status: str = None, customer: str = None, material: str = None):
    """
    Fetch orders with optional filters.
    """
    params = {}
    if status:
        params["status"] = status
    if customer:
        params["customer"] = customer
    if material:
        params["material"] = material
    
    try:
        response = requests.get(f"{API_BASE_URL}/orders", params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def get_order_by_id(order_id: str):
    """
    Fetch a single order by its Sales Order ID.
    """
    try:
        response = requests.get(f"{API_BASE_URL}/orders/{order_id}")
        if response.status_code == 404:
            return {"error": "Order not found"}
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def get_orders_from_hana():
    """
    Fetch orders directly from SAP HANA database.
    Note: You may need to adjust the table name 'ORDERS' to match your actual schema.
    """
    print("Attempting to fetch orders from SAP HANA...")
    # Example query - replace 'ORDERS' with your actual table name if different
    # You might also need schema prefix like 'MY_SCHEMA"."ORDERS'
    query = 'SELECT "SalesOrder", "Customer", "Material", "Qty", "DeliveryDate", "Status" FROM SALES_ORDERS_ANALYSIS'
    return fetch_data_from_hana(query)

SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "system-prompts", "system-prompt-1.txt")

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
                {"role": "user", "content": f"Here is the sales order data to analyze:\n{data_str}"}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        raw = completion.choices[0].message.content
        return json.loads(raw)
    except Exception as e:
        return f"Error during analysis: {str(e)}"

# Define tools - REMOVED (Not needed for single-task script)

def main():
    print("--- SAP Sales Order Analysis Agent ---")
    
    # Check API availability
    try:
        requests.get(API_BASE_URL)
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to API at {API_BASE_URL}.")
        print("Please ensure your Express JS API is running.")
        # Don't return here, try HANA if API is down
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

    orders_data = []
    
    # Try fetching from API first
    print("\n1. Fetching Sales Orders...")
    api_orders = get_orders()
    
    if isinstance(api_orders, list) and api_orders:
        orders_data = api_orders
        print(f"   Retrieved {len(orders_data)} orders from API.")
    elif hana_available:
        # Fallback to HANA or prefer HANA if API failed
        print("   API orders not found or error. Trying SAP HANA...")
        hana_orders = get_orders_from_hana()
        if isinstance(hana_orders, list):
            orders_data = hana_orders
            print(f"   Retrieved {len(orders_data)} orders from SAP HANA.")
        else:
             print(f"   Error fetching from HANA: {hana_orders}")
    
    if not orders_data:
        if isinstance(api_orders, dict) and "error" in api_orders:
             print(f"   API Error: {api_orders['error']}")
        print("   No orders found from any source to analyze.")
        return

    # Data Cleaning
    print("2. Cleaning data...")
    cleaned_orders = []
    for order in orders_data:
        cleaned_item = order.copy()
        for key, value in cleaned_item.items():
            if isinstance(value, str):
                cleaned_item[key] = value.strip()
        
        # fix date format M/D/YY -> YYYY-MM-DD
        if "DeliveryDate" in cleaned_item:
            try:
                parts = cleaned_item["DeliveryDate"].split('/')
                if len(parts) == 3:
                     # Assumption: Month/Day/Year (2-digit)
                     m, d, y = parts
                     if len(y) == 2: y = "20" + y
                     cleaned_item["DeliveryDate"] = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
            except Exception:
                pass # keep original if parse fails
        
        cleaned_orders.append(cleaned_item)

    print("3. Analyzing data with AI...")
    analysis_result = analyze_data(cleaned_orders)
    
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
