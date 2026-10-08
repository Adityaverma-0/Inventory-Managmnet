from invoice2data.api import extract_data
from invoice2data.extract.loader import read_templates
from invoice2data.input import pdfminer_wrapper

file = "/sessions/jolly-determined-gauss/mnt/uploads/demo_invoice.pdf"
templates = read_templates("backend/invoice_extraction/templates")
res = extract_data(file, templates=templates, input_module=pdfminer_wrapper)
print("EXTRACT:", res)
