"""Convert the two source workbooks to JSON for the static GitHub Pages site.

Uses only the Python standard library. Run from any directory:
    python scripts/build_data.py
"""

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
COLUMNS = (
    "topic", "title", "method", "motivation", "summary", "authors",
    "venue", "year", "url", "tags", "presenter",
)
SOURCES = (("模板 - 发表后.xlsx", "featured.json"), ("模板 - 全部.xlsx", "all.json"))


def col_index(reference):
    letters = re.match(r"[A-Z]+", reference).group()
    result = 0
    for letter in letters:
        result = result * 26 + ord(letter) - ord("A") + 1
    return result - 1


def read_rows(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(part.text or "" for part in entry.iter(MAIN + "t"))
                       for entry in shared.findall(MAIN + "si")]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in sheet.iter(MAIN + "row"):
            values = [None] * len(COLUMNS)
            for cell in row.findall(MAIN + "c"):
                index = col_index(cell.attrib["r"])
                if index >= len(values):
                    continue
                value = cell.find(MAIN + "v")
                if cell.attrib.get("t") == "inlineStr":
                    values[index] = "".join(part.text or "" for part in cell.iter(MAIN + "t"))
                elif value is not None:
                    raw = value.text or ""
                    values[index] = strings[int(raw)] if cell.attrib.get("t") == "s" else raw
            yield values


def build(source_name, output_name):
    rows = list(read_rows(ROOT / "source" / source_name))
    expected = ["类别", "论文名称", "算法名称", "研究动机", "论文概述与核心创新点",
                "作者信息", "会议/期刊", "发表年份", "论文链接", "关键技术标签", "汇报人"]
    if rows[0] != expected:
        raise ValueError(f"Unexpected columns in {source_name}: {rows[0]}")
    result = []
    for row in rows[1:]:
        if not str(row[1] or "").strip():
            continue
        item = {key: str(value or "").strip() for key, value in zip(COLUMNS, row)}
        item["id"] = f"{output_name[:-5]}-{len(result) + 1}"
        item["year"] = int(item["year"]) if item["year"] else None
        if item["url"].startswith("doi.org/"):
            item["url"] = "https://" + item["url"]
        item["tags"] = [tag.strip() for tag in re.split(r"[；;]", item["tags"]) if tag.strip()]
        result.append(item)
    target = ROOT / "data" / output_name
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{source_name} → {output_name}: {len(result)} papers")


if __name__ == "__main__":
    for source, output in SOURCES:
        build(source, output)
