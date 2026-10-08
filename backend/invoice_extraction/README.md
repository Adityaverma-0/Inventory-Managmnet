# Local invoice extraction

Install Python dependencies in the existing extraction environment:

```sh
backend/invoice_extraction/venv/bin/python -m pip install -r backend/invoice_extraction/requirements.txt
```

Scanned PDFs additionally require Tesseract 5 with English language data:

```sh
# macOS
brew install tesseract
# Debian / Ubuntu
sudo apt-get install tesseract-ocr tesseract-ocr-eng
```

The server discovers Tesseract on PATH and in the standard Homebrew locations.
Set `TESSERACT_CMD` to the executable's absolute path for other installations.
`INVOICE_PYTHON` can override the existing virtual environment's Python path.
No document data is sent to an external OCR or AI service; there are no runtime
model downloads. PDFium renders pages locally, and temporary images are removed
after extraction, including failed OCR calls.

Text PDFs use pdfminer and invoice2data as before. Image-only pages use local OCR;
ruled tables are reconstructed from coordinates, preserving missing cells and
wrapped descriptions. OCR is limited to 10 scanned pages and a 35-second document
processing budget. Use smaller files if that limit is reached. Rotated, skewed,
or very faint scans may require manual correction. All OCR results require
review. Inconsistent prices are left blank instead of guessing missing decimals.
Extraction never saves inventory.

Run tests:

```sh
PYTHONDONTWRITEBYTECODE=1 backend/invoice_extraction/venv/bin/python -B -m unittest discover -s backend/invoice_extraction -p 'test_*.py'
```

To include the original reported scan in local regression checks without copying
private supplier data into the repository, set `INVOICE_TEST_SCAN` to its path.
