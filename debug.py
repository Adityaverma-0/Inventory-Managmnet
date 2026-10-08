from invoice2data.extract.loader import read_templates
from invoice2data.api import extract_data

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
templates = read_templates("backend/invoice_extraction/templates")
for t in templates:
    print(t['template_name'])

res = extract_data(file, templates=templates)
print("EXTRACT_DATA:", res)
