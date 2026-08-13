import csv
import io
from datetime import datetime, timezone


def _normalize_ascii(value: str) -> str:
    return (
        value.encode("ascii", "replace")
        .decode("ascii")
        .replace("?", "")
    )


def build_csv(indicadores: list[tuple[str, str]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(["Indicador", "Valor"])
    for label, value in indicadores:
        writer.writerow([label, value])
    return buffer.getvalue().encode("utf-8-sig")


def build_pdf(titulo: str, linhas: list[str]) -> bytes:
    content_lines = [_normalize_ascii(titulo), "IFCE - Campus Taua | Sistema CPA", ""] + [
        _normalize_ascii(line) for line in linhas
    ]
    escaped = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in content_lines]
    stream_parts = ["BT", "/F1 16 Tf", "60 780 Td"]
    for index, line in enumerate(escaped):
        if index == 0:
            stream_parts.append(f"({line}) Tj")
        else:
            stream_parts.append("0 -18 Td")
            stream_parts.append(f"({line}) Tj")
    stream_parts.append("ET")
    content = "\n".join(stream_parts)
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        f"<< /Length {len(content)} >>\nstream\n{content}\nendstream",
    ]
    pdf = "%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{index} 0 obj\n{obj}\nendobj\n"
    xref = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for offset in offsets[1:]:
        pdf += f"{offset:010d} 00000 n \n"
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return pdf.encode("latin-1", errors="replace")


def report_rows(dashboard: dict, results: dict | None = None) -> list[tuple[str, str]]:
    rows = [
        ("Participacao geral", f"{dashboard['historico'][-1]['participacao']}%"),
        ("Satisfacao geral", f"{dashboard['satisfacao_geral']}%"),
        ("Respostas consolidadas", str(dashboard["total_respostas"])),
        ("Media geral", str(dashboard["media_geral"])),
        ("Gerado em", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        ("Observacao", "Documento consolidado. Dados individuais nao sao exibidos."),
    ]
    if results:
        rows.extend(
            [
                ("Campanha", results["campanha"].nome),
                ("Participacao da campanha", f"{results['participacao']}%"),
                ("Satisfacao da campanha", f"{results['satisfacao']}%"),
                ("Respostas da campanha", str(results["total_respostas"])),
            ]
        )
    return rows
