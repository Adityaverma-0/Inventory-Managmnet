from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import random

def create_invoice(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Sample Purchase Invoice")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Sample data for testing the purchase invoice feature.")
    
    # Table Header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 120, "Item Name")
    c.drawString(300, height - 120, "Qty")
    c.drawString(400, height - 120, "Price")
    
    # Items
    items = [
        "A4 Copy Paper Box", "Ball Pen Blue Box", "Notebook 200 Pages",
        "Stapler Medium", "Stapler Pins Box", "Permanent Marker Black",
        "File Folder Pack", "Whiteboard Marker Set", "Desk Calculator",
        "USB Flash Drive 32GB", "Desk Organizer", "Adhesive Tape Set",
        "Correction Fluid Pack", "Highlighter Set", "Printer Ink Black"
    ]
    
    c.setFont("Helvetica", 10)
    y = height - 140
    for name in items:
        qty = random.randint(2, 20)
        price = random.randint(15, 600)
        c.drawString(50, y, name)
        c.drawString(300, y, str(qty))
        c.drawString(400, y, str(price))
        y -= 25
        
    c.save()

create_invoice("/sessions/jolly-determined-gauss/mnt/admin-dashboard /demo_invoice.pdf")
