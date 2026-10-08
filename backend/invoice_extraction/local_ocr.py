
"""Offline Tesseract OCR with coordinate-based reconstruction of ruled tables."""
import csv
import io
import os
import re
import statistics
from pathlib import Path
import shutil
import subprocess
import tempfile
import time


class OCRError(Exception):
    def __init__(self, code, message):
        self.code = code
        super().__init__(message)


def tesseract_binary():
    configured = os.environ.get('TESSERACT_CMD')
    candidates = [configured] if configured else [shutil.which('tesseract'), '/opt/homebrew/bin/tesseract', '/usr/local/bin/tesseract']
    for candidate in candidates:
        if candidate and os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    raise OCRError('OCR_UNAVAILABLE', 'Local OCR is unavailable. Install Tesseract with English language data on the server, then retry.')


def recognize(image, folder, name, psm, deadline=None):
    # Leptonica on macOS needs canonical paths, including /private/tmp rather than /tmp.
    path = str(Path(folder, name + '.png').resolve())
    image.save(path)
    command = [tesseract_binary(), path, 'stdout', '-l', 'eng', '--psm', str(psm), '-c', 'tessedit_create_tsv=1', '-c', 'thresholding_method=2']
    remaining = min(25, deadline - time.monotonic()) if deadline is not None else 10000
    if remaining <= 0:
        raise OCRError('OCR_TIMEOUT', 'Local OCR timed out. Try fewer pages or a clearer PDF.')
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=remaining, check=False)
    except subprocess.TimeoutExpired as exc:
        raise OCRError('OCR_TIMEOUT', 'Local OCR timed out. Try fewer pages or a clearer PDF.') from exc
    except OSError as exc:
        raise OCRError('OCR_UNAVAILABLE', 'The local OCR engine could not be started.') from exc
    if result.returncode:
        raise OCRError('OCR_FAILED', 'Local OCR could not read this scan. Check Tesseract English language data or try a clearer PDF.')
    words = []
    for row in csv.DictReader(io.StringIO(result.stdout), delimiter='\t', quoting=csv.QUOTE_NONE):
        if row.get('level') == '5' and row.get('text', '').strip():
            words.append({key: int(row[key]) for key in ('left', 'top', 'width', 'height')} | {'text': row['text'].strip(), 'confidence': float(row['conf'])})
    return words


def text_lines(words):
    rows = []
    for word in sorted(words, key=lambda word: (word['top'] + word['height'] / 2, word['left'])):
        y = word['top'] + word['height'] / 2
        if not rows or abs(rows[-1][0] - y) > max(8, word['height'] * .55):
            rows.append((y, []))
        rows[-1][1].append(word)
    output = []
    for _, words in rows:
        words.sort(key=lambda word: word['left'])
        line, last_right = '', None
        for word in words:
            gap = '  ' if last_right is not None and word['left'] - last_right > word['height'] else ' '
            line += (gap if line else '') + word['text']
            last_right = word['left'] + word['width']
        output.append(line)
    return '\n'.join(output)


def bands(values):
    groups = []
    for value in values:
        if not groups or value > groups[-1][1] + 1:
            groups.append([value, value])
        else:
            groups[-1][1] = value
    return groups


def table_grid(image):
    """Find a sustained grid, excluding the differently divided invoice heading."""
    width, height = image.size
    mask = image.point(lambda p: 255 if p < 200 else 0)
    xs = bands(x for x in range(width) if mask.crop((x, 0, x + 1, height)).histogram()[255] > height * .4)
    ys = bands(y for y in range(height) if mask.crop((0, y, width, y + 1)).histogram()[255] > width * .65)
    if len(xs) < 4 or len(ys) < 4:
        return None
    runs, run = [], []
    for index in range(len(ys) - 1):
        mid = (ys[index][1] + ys[index + 1][0]) // 2
        intersections = sum(mask.getpixel(((a + b) // 2, mid)) > 0 for a, b in xs)
        if intersections >= len(xs) * .8:
            run.append(index)
        else:
            if run:
                runs.append(run)
            run = []
    if run:
        runs.append(run)
    if not runs:
        return None
    run = max(runs, key=len)
    return (xs, ys[run[0]:run[-1] + 2]) if len(run) >= 3 else None


def grid_text(words, xs, ys):
    rows = []
    for top, bottom in zip(ys, ys[1:]):
        cells = []
        for left, right in zip(xs, xs[1:]):
            inside = [word for word in words if left[1] < word['left'] + word['width'] / 2 < right[0]
                      and top[1] < word['top'] + word['height'] / 2 < bottom[0]]
            # Fold wrapped cell text while retaining an explicit missing-cell marker.
            cells.append(' '.join(text_lines(inside).split()) or '-')
        rows.append(cells)
    return rows


def page_text(pdf_path, page_index, deadline=None):
    try:
        import pypdfium2 as pdfium
        from PIL import ImageDraw
    except ImportError as exc:
        raise OCRError('OCR_UNAVAILABLE', 'Local PDF rendering is unavailable. Install the invoice extraction requirements, then retry.') from exc
    tesseract_binary()
    with pdfium.PdfDocument(pdf_path) as document:
        page = document[page_index]
        try:
            width, height = page.get_size()
            scale = min(200 / 72, (16_000_000 / max(1, width * height)) ** .5)
            bitmap = page.render(scale=scale)
            try:
                image = bitmap.to_pil().convert('L')
            finally:
                bitmap.close()
        finally:
            page.close()
    with tempfile.TemporaryDirectory(prefix='invoice-ocr-') as folder:
        grid = table_grid(image)
        if not grid:
            return text_lines(recognize(image, folder, 'page', 3, deadline)), None
        xs, ys = grid
        heading = image.crop((0, 0, image.width, ys[0][0]))
        heading_words = recognize(heading, folder, 'heading', 11, deadline)
        heading_text = text_lines(heading_words)
        # A date in the right-hand header may be interleaved with the seller's name.
        for label in heading_words:
            if label['text'].lower().rstrip(':') == 'date':
                nearby = [word for word in heading_words if abs(word['left'] - label['left']) < label['height'] * 2
                          and 0 < word['top'] - label['top'] < label['height'] * 4
                          and re.fullmatch(r'\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}', word['text'])]
                if len(nearby) == 1:
                    heading_text += '\nDate: ' + nearby[0]['text']
        # Remove only table rules; never erase header/supplier text at the same x coordinate.
        cleaned = image.copy()
        draw = ImageDraw.Draw(cleaned)
        for a, b in ys:
            draw.rectangle((xs[0][0], a - 1, xs[-1][1], b + 1), fill=255)
        for a, b in xs:
            draw.rectangle((a - 1, ys[0][0], b + 1, ys[-1][1]), fill=255)

        table_top = ys[0][0]
        table_image = cleaned.crop((0, table_top, cleaned.width, cleaned.height))
        words = recognize(table_image, folder, 'table', 6, deadline)
        for word in words:
            word['top'] += table_top

        table = grid_text(words, xs, ys)
        # Tall rows contain wrapped names. Read these cells separately so OCR does
        # not merge the first line of the name into adjacent numeric columns.
        typical_height = statistics.median(bottom[0] - top[1] for top, bottom in zip(ys, ys[1:]))
        for ri, (top, bottom) in enumerate(zip(ys, ys[1:])):
            if bottom[0] - top[1] > typical_height * 1.35:
                for ci, (left, right) in enumerate(zip(xs, xs[1:])):
                    if right[0] - left[1] > image.width * .15:
                        crop = cleaned.crop((left[1] + 2, top[1] + 2, right[0] - 2, bottom[0] - 2))
                        value = text_lines(recognize(crop, folder, f'wrapped-{ri}-{ci}', 6, deadline))
                        if value.strip():
                            table[ri][ci] = ' '.join(value.split())
        footer = text_lines([word for word in words if word['top'] > ys[-1][1]])
        return heading_text + '\n' + footer, table