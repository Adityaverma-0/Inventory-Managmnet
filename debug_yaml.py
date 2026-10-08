import yaml
try:
    with open("backend/invoice_extraction/templates/sample_supplier.yml", "r") as f:
        y = yaml.safe_load(f)
        print("YAML Loaded:", y)
except Exception as e:
    print("Error:", e)
