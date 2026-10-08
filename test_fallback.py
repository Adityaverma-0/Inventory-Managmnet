import sys
sys.path.insert(0, "backend/invoice_extraction")
from extractor2 import extract_generic_text, fallback_parse

pdf_path = "/sessions/jolly-determined-gauss/mnt/uploads/demo_invoice.pdf"

text = extract_generic_text(pdf_path)
print("GENERIC TEXT START:")
print(text[:200])
print("GENERIC TEXT END")

parsed = fallback_parse(text)
print("FALLBACK PARSE:", parsed)
