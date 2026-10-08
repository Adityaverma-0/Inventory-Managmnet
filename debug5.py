from invoice2data.extract.loader import read_templates
from invoice2data.api import extract_data

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
templates = read_templates("backend/invoice_extraction/templates")
try:
    res = extract_data(file, templates=templates, raise_on_error=True)
    print("EXTRACT:", res)
except Exception as e:
    print("ERROR:", repr(e))
