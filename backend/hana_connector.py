
import os
from dotenv import load_dotenv

try:
    from hdbcli import dbapi
except ImportError:
    dbapi = None

# Load environment variables
load_dotenv()

def get_hana_connection():
    """
    Establishes a connection to the SAP HANA Cloud instance.
    Returns a connection object if successful, or None if connection fails.
    """
    if dbapi is None:
        print("Warning: hdbcli is not installed. HANA connection is unavailable.")
        return None

    hana_address = os.getenv("HANA_ADDRESS")
    hana_port = os.getenv("HANA_PORT") 
    hana_user = os.getenv("HANA_USER")
    hana_password = os.getenv("HANA_PASSWORD")

    # Basic validation
    if not all([hana_address, hana_port, hana_user, hana_password]):
        print("Error: Missing HANA connection details in .env file.")
        return None

    try:
        # Convert port to int if it's a string
        if isinstance(hana_port, str):
            hana_port = int(hana_port)

        # Debug connection params
        print(f"Connecting to {hana_address}:{hana_port} as {hana_user}...")
        
        conn = dbapi.connect(
            address=hana_address,
            port=int(hana_port),
            user=hana_user,
            password=hana_password,
            encrypt=True, # Boolean required for some versions
            sslValidateCertificate=False # Boolean 
        )
        return conn
    except Exception as e:
        print(f"Failed to connect to SAP HANA: {str(e)}")
        return None

def fetch_data_from_hana(query):
    """
    Executes a SQL query and returns the results as a list of dictionaries.
    """
    conn = get_hana_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Fetch column names
            columns = [column[0] for column in cursor.description]
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            results = []
            for row in rows:
                results.append(dict(zip(columns, row)))
            
            conn.close()
            return results
        except Exception as e:
            print(f"Error executing query: {e}")
            if conn:
                conn.close()
            return {"error": str(e)}
    else:
        return {"error": "Could not establish connection to SAP HANA."}
