import logging
logging.basicConfig(level=logging.DEBUG)
from invoice2data.api import extract_data
from invoice2data.extract.loader import read_templates

file = "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf"
templates = read_templates("backend/invoice_extraction/templates")
res = extract_data(file, templates=templates)
print("EXTRACT:", res)
