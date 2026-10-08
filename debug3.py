from invoice2data.extract.loader import read_templates
from invoice2data.api import extract_data

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
templates = read_templates("backend/invoice_extraction/templates")
# Read raw file to see what matches
for t in templates:
    print(f"Checking {t['template_name']}")
    matches = t.matches_input(file)
    print(f"Matches: {matches}")
