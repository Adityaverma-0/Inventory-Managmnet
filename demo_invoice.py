from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_invoice(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "Purchase Invoice")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Invoice Number: INV-98234")
    c.drawString(50, height - 85, "Date: 2026-10-08")
    
    # Table Header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 130, "Description")
    c.drawString(300, height - 130, "Quantity")
    c.drawString(450, height - 130, "Price")
    
    # Line Items
    items = [
        ("A4 Copy Paper Box", 15, 300),
        ("Blue Ballpoint Pens Box", 20, 20),
        ("Stapler Standard", 5, 120),
        ("Stapler Pins Pack", 25, 40),
        ("Highlighter Yellow pack", 10, 85),
        ("Sticky Notes Pad", 30, 25),
        ("Whiteboard Core Marker", 12, 45),
        ("Printer Ink Cartridge Black", 4, 1200),
        ("Desk Organizer Tray", 5, 250),
        ("File Folders Set", 10, 80)
    ]
    
    y = height - 160
    c.setFont("Helvetica", 10)
    total = 0
    for name, qty, price in items:
        c.drawString(50, y, name)
        c.drawString(300, y, str(qty))
        c.drawString(450, y, str(price))
        total += (qty * price)
        y -= 25
        
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, y - 20, "Total:")
    c.drawString(450, y - 20, str(total))
        
    c.save()

create_invoice("/sessions/jolly-determined-gauss/mnt/admin-dashboard /ideal_invoice.pdf")
