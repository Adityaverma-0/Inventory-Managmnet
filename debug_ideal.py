import sys
sys.path.insert(0, "backend/invoice_extraction")
from extractor import extract_generic_text, fallback_parse

pdf_path = "/sessions/jolly-determined-gauss/mnt/admin-dashboard /ideal_invoice.pdf"

text = extract_generic_text(pdf_path)
parsed = fallback_parse(text)
print("PARSED INVOICE NO:", parsed['invoice_number'])
print("PARSED DATE:", parsed['date'])
print("ITEMS COUNT:", len(parsed['items']))
if parsed['items']:
    print("FIRST ITEM:", parsed['items'][0])
