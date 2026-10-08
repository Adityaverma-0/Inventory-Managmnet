from invoice2data.extract.loader import read_templates
from invoice2data.extract.parsers import pdftotext

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
text = pdftotext.to_text(file).decode('utf-8')
print("TEXT PREFIX:", repr(text[:100]))

templates = read_templates("backend/invoice_extraction/templates")
for t in templates:
    print(f"{t['template_name']} matches? {t.matches_input(text)}")
