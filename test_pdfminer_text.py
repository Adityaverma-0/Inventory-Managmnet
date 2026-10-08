from invoice2data.input import pdfminer_wrapper
print(pdfminer_wrapper.to_text("/sessions/jolly-determined-gauss/mnt/uploads/demo_invoice.pdf").decode('utf-8'))
