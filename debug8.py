from invoice2data.extract.loader import read_templates
import subprocess
out = subprocess.run(["pdftotext", "-layout", "/sessions/jolly-determined-gauss/mnt/uploads/sample.pdf", "-"], capture_output=True)
text = out.stdout.decode('utf-8')
print("TEXT PREFIX:", repr(text[:100]))

templates = read_templates("backend/invoice_extraction/templates")
for t in templates:
    print(f"{t['template_name']} matches? {t.matches_input(text)}")
