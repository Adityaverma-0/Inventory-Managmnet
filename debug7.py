from invoice2data.extract.loader import read_templates
from invoice2data.api import extract_text

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
text = extract_text(file).get_text()
print("TEXT PREFIX:", repr(text[:100]))

templates = read_templates("backend/invoice_extraction/templates")
for t in templates:
    print(f"{t['template_name']} matches? {t.matches_input(text)}")
