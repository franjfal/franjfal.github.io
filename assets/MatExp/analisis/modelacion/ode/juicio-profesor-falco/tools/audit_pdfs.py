#!/usr/bin/env python3
"""Check the PDFs written by render_pdfs.py against ESTANDAR_WEB_ACTIVIDADES.md, 4.1 and 4.2.

For every page of every PDF it reports
  * text below 9 pt that is not the footer or the "teacher only" stamp (8 pt by the standard);
  * a heading (11.5 pt or more) as the last text line of a page (orphaned heading);
  * how much of the page height is empty below the content (footer band excluded); a page that
    is more than a quarter empty is flagged unless it is the last page of its document: the last
    page of the file, or, in packets, the page before a new document (chapter) starts.

Usage: python3 tools/audit_pdfs.py /private/tmp/claude-501/trial-work/after [--verbose]
"""
import pathlib
import sys

import fitz  # PyMuPDF

SMALL_OK = {"SOLO PROFESORADO", "TEACHER ONLY"}
CHAPTER_FILL = (247, 245, 239)


def chapter_starts(doc):
    """Pages (0-based) whose top holds the paper-coloured box that opens a document in a packet."""
    starts = set()
    for k, page in enumerate(doc):
        for d in page.get_drawings():
            fill = d.get("fill")
            if not fill or d["rect"].y0 > 60 or d["rect"].width < page.rect.width * 0.7:
                continue
            if all(abs(c * 255 - t) < 2 for c, t in zip(fill, CHAPTER_FILL)):   # jsPDF writes two decimals
                starts.add(k)
                break
    return starts


def audit(pdf, verbose=False):
    problems = []
    with fitz.open(pdf) as doc:
        starts = chapter_starts(doc)
        sizes = {}
        slides = {k for k, page in enumerate(doc) if page.rect.width > page.rect.height}
        for k, page in enumerate(doc):
            if k in slides:     # the 16:9 presentation is projected: only its text sizes are checked
                for b in page.get_text("dict")["blocks"]:
                    for line in b.get("lines", []):
                        for span in line["spans"]:
                            if span["text"].strip() and span["size"] < 8 - 0.05:
                                problems.append(f"slide p{k + 1}: {round(span['size'], 1)} pt «{span['text'].strip()[:40]}»")
                continue
            h = page.rect.height
            footer = h - 45
            bottom = 0.0
            last = None   # lowest text line above the footer: a heading there is orphaned
            for b in page.get_text("dict")["blocks"]:
                if b["type"] == 1:      # image
                    bottom = max(bottom, b["bbox"][3])
                    continue
                for line in b["lines"]:
                    for span in line["spans"]:
                        if not span["text"].strip():
                            continue
                        y = span["bbox"][3]
                        size = round(span["size"], 1)
                        if y < footer:
                            if last is None or y > last[0] + 0.5:
                                last = (y, size, span["text"].strip())
                            bottom = max(bottom, y)
                            sizes[size] = sizes.get(size, 0) + 1
                            if size < 9 and span["text"].strip() not in SMALL_OK:
                                problems.append(f"p{k + 1}: {size} pt «{span['text'].strip()[:40]}»")
            if last and last[1] >= 11.5 and k < len(doc) - 1:
                problems.append(f"p{k + 1}: heading alone at the foot of the page «{last[2][:40]}»")
            for d in page.get_drawings():
                r = d["rect"]
                if r.y1 < footer and r.height < h * 0.9:
                    bottom = max(bottom, r.y1)
            usable = footer - 50
            empty = max(0.0, (footer - bottom) / usable)
            last_of_doc = k == len(doc) - 1 or (k + 1) in starts or (k + 1) in slides
            flag = empty > 0.25 and not last_of_doc
            if flag:
                problems.append(f"p{k + 1}: {empty:.0%} empty (not the last page of its document)")
            if verbose:
                print(f"   p{k + 1}: {empty:.0%} empty{' (end of document)' if last_of_doc else ''}")
        if verbose:
            print("   sizes:", dict(sorted(sizes.items())))
    return problems


def main():
    root = pathlib.Path(sys.argv[1])
    verbose = "--verbose" in sys.argv
    bad = 0
    for pdf in sorted(root.rglob("*.pdf")):
        if verbose:
            print(pdf.relative_to(root))
        problems = audit(pdf, verbose)
        if problems:
            bad += 1
            print(pdf.relative_to(root))
            for p in problems:
                print("   ", p)
    print(f"{bad} PDF with problems")


if __name__ == "__main__":
    main()
