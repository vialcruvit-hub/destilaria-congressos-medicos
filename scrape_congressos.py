import csv
import datetime as dt
import json
import re
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

MONTHS_PT = {
    "jan": 1, "janeiro": 1,
    "fev": 2, "fevereiro": 2,
    "mar": 3, "marco": 3, "março": 3,
    "abr": 4, "abril": 4,
    "mai": 5, "maio": 5,
    "jun": 6, "junho": 6,
    "jul": 7, "julho": 7,
    "ago": 8, "agosto": 8,
    "set": 9, "setembro": 9,
    "out": 10, "outubro": 10,
    "nov": 11, "novembro": 11,
    "dez": 12, "dezembro": 12,
}

STOPWORDS = {
    "de", "da", "do", "das", "dos", "e", "em", "a", "o", "na", "no", "para", "com",
    "por", "sobre", "congresso", "brasileiro", "brasileira", "nacional", "internacional",
    "regional", "mundial", "simposio", "jornada", "encontro", "semana", "feira",
    "annual", "meeting", "congress", "conference", "world", "symposium", "sociedade",
    "brasil", "associacao", "academia", "colegio", "federacao", "departamento",
    "paulista", "mineiro", "baiano", "goiano", "cearense", "pernambucano", "nordeste",
    "norte", "sul", "sudeste", "centro", "oeste", "latino", "americano", "americana",
    "interamericano", "edicao", "medicina", "medico", "medicos", "saude", "praticas",
    "atualizacao", "2026", "2027", "2028", "the", "for", "and", "of", "in", "on",
    "estado", "sao", "paulo", "rio", "janeiro",
}

GENERIC_ACRONYMS = {"SBC", "SBA", "SBR", "SBP", "ABN", "USP", "UERJ", "AMB", "EUA", "2026", "2027", "2028"}
ROMAN_RE = re.compile(r"^(?=[MDCLXVI]+\b)M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$", re.I)

UF_SET = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}

COUNTRY_MAP = {
    "eua": "Estados Unidos",
    "estados unidos": "Estados Unidos",
    "estados unidos da america": "Estados Unidos",
    "holanda": "Países Baixos",
    "paises baixos": "Países Baixos",
    "austria": "Áustria",
    "italia": "Itália",
    "espanha": "Espanha",
    "hungria": "Hungria",
    "canada": "Canadá",
    "mexico": "México",
    "malta": "Malta",
    "brasil": "Brasil",
}

CITY_ALIASES = {
    "amsterdam": "Amsterdã",
    "amsterda": "Amsterdã",
}

THEME_ALIASES = {
    "alergologia": "Alergia e Imunologia",
    "alergia e imunologia": "Alergia e Imunologia",
    "endocrinologia": "Endocrinologia e Metabologia",
    "endocrinologia e diabetes": "Endocrinologia e Metabologia",
    "endocrinologia e metabologia": "Endocrinologia e Metabologia",
    "diabetes e metabolismo": "Endocrinologia e Metabologia",
    "diabetologia": "Diabetologia",
    "radiologia": "Radiologia e Diagnóstico por Imagem",
    "radiologia e diagnostico por imagem": "Radiologia e Diagnóstico por Imagem",
    "geriatria": "Geriatria e Gerontologia",
    "geriatria e gerontologia": "Geriatria e Gerontologia",
    "medicina de familia": "Medicina de Família e Comunidade",
    "medicina de familia e comunidade": "Medicina de Família e Comunidade",
    "medicina de emergencia": "Medicina de Emergência",
    "medicina canabica": "Medicina Canabinoide",
    "medicina canabinoide": "Medicina Canabinoide",
    "gestao e tecnologia em saude": "Gestão e Tecnologia em Saúde",
    "transplantes": "Transplantes",
    "transplante de orgaos": "Transplantes",
    "dor": "Medicina da Dor",
    "medicina da dor": "Medicina da Dor",
    "neuro-oncologia": "Neuro-Oncologia",
}


def fetch_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    if resp.encoding and resp.encoding.lower() in ("iso-8859-1", "latin-1"):
        text = resp.content.decode("utf-8", errors="replace")
    else:
        text = resp.text
    return BeautifulSoup(text, "html.parser")


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def parse_date_info(data_str: str) -> tuple[int, int, int, int]:
    """Extrai (ano, mes, dia_inicio, dia_fim) aproximados para deduplicação e ordenação."""
    s = strip_accents(data_str.lower())
    year_m = re.search(r"(202[6-9])", s)
    year = int(year_m.group(1)) if year_m else 2027

    m_slash_all = re.findall(r"(\d{1,2})/(\d{1,2})(?:/(202[6-9]))?", s)
    if m_slash_all:
        d1, m1, y1 = m_slash_all[0]
        d2, m2, _ = m_slash_all[-1]
        y = int(y1) if y1 else year
        return (y, int(m1), int(d1), int(d2) if m1 == m2 else 31)

    m_iso = re.findall(r"(202[6-9])-(\d{2})-(\d{2})", s)
    if m_iso:
        y1, m1, d1 = m_iso[0]
        _, m2, d2 = m_iso[-1]
        return (int(y1), int(m1), int(d1), int(d2) if m1 == m2 else 31)

    if "definir" in s or "nao divulgad" in s:
        return (year, 99, 99, 99)

    month = 99
    for name, num in MONTHS_PT.items():
        if re.search(rf"\b{name}\b", s):
            month = num
            break

    days = [int(x) for x in re.findall(r"\b(\d{1,2})\b", s) if 1 <= int(x) <= 31]
    d_start = days[0] if days else 99
    d_end = days[1] if len(days) > 1 and days[1] >= d_start else d_start
    return (year, month, d_start, d_end)


# ---------- Scrapers ----------

def scrape_usebip() -> list[dict]:
    url = "https://www.usebip.com/blogs/bip-insights/calendario-de-congressos-medicos-2027"
    soup = fetch_soup(url)
    items = []
    for h3 in soup.find_all("h3"):
        title = clean_text(h3.get_text(" ", strip=True))
        if title in ("Continue sua jornada", "Deixe seu comentário") or not title:
            continue
        card = h3.parent.parent if h3.parent and h3.parent.parent else h3.parent
        lines = [clean_text(x) for x in card.get_text("\n", strip=True).split("\n") if clean_text(x)]
        if len(lines) < 4 or title not in lines:
            continue
        idx = lines.index(title)
        day_part = lines[0] if idx >= 2 else ""
        mon_part = lines[1] if idx >= 2 else ""
        if day_part.lower().startswith("a definir"):
            data_str = f"A definir - 2027 ({lines[-1]})" if len(lines) > idx + 3 else "A definir (2027)"
        elif day_part and mon_part:
            data_str = f"{day_part} {mon_part} 2027"
        else:
            data_str = "A definir (2027)"
        tema = lines[idx + 1] if len(lines) > idx + 1 else ""
        local = lines[idx + 2] if len(lines) > idx + 2 else ""
        items.append({"nome": title, "data": data_str, "local": local, "tema": tema, "fonte": "usebip.com"})
    return items


def scrape_agenciadomedico() -> list[dict]:
    url = "https://agenciadomedico.com.br/congressos-medicos-2027/"
    soup = fetch_soup(url)
    items = []
    table = soup.find("table")
    if table:
        for tr in table.find_all("tr")[1:]:
            cols = [clean_text(c.get_text(" ", strip=True)) for c in tr.find_all("td")]
            if len(cols) >= 4:
                items.append({"nome": cols[0], "data": cols[2], "local": cols[3], "tema": cols[1], "fonte": "agenciadomedico.com.br"})
    return items


def scrape_tivita() -> list[dict]:
    url = "https://tivita.com/conteudos/agenda-congressos-saude-2027"
    soup = fetch_soup(url)
    items = []
    months_only = {strip_accents(k) for k in MONTHS_PT}
    for h5 in soup.find_all("h5"):
        title = clean_text(h5.get_text(" ", strip=True))
        if not title or strip_accents(title.lower()) in months_only:
            continue
        desc, quando, onde = "", "", ""
        cur = h5.find_next_sibling()
        while cur and cur.name not in ("h5", "h2", "h3"):
            txt = clean_text(cur.get_text(" ", strip=True))
            if "Quando" in txt and "Onde" in txt:
                m_q = re.search(r"Quando\s*:\s*(.*?)\s*Onde\s*:", txt)
                m_o = re.search(r"Onde\s*:\s*(.*?)(?:\s*Para mais informações.*)?$", txt)
                if m_q:
                    quando = clean_text(m_q.group(1))
                if m_o:
                    onde = clean_text(m_o.group(1))
                break
            elif txt and not txt.startswith("Dica de agenda"):
                desc = txt
            cur = cur.find_next_sibling()
        if quando or onde:
            items.append({"nome": title, "data": quando or "2027", "local": onde, "tema": desc, "fonte": "tivita.com"})
    return items


def scrape_agrupamed() -> list[dict]:
    url = "https://agrupamed.com.br/congressos"
    soup = fetch_soup(url)
    items = []
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(sc.string or "{}")
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "CollectionPage":
            for el in data.get("mainEntity", {}).get("itemListElement", []):
                ev = el.get("item", el)
                start, end = ev.get("startDate", ""), ev.get("endDate", "")
                data_str = f"{start} a {end}" if start and end else start
                loc = ev.get("location", {})
                local = loc.get("name", "") if isinstance(loc, dict) else str(loc)
                items.append({"nome": clean_text(ev.get("name", "")), "data": data_str, "local": clean_text(local), "tema": "", "fonte": "agrupamed.com.br"})
    return items


def scrape_starmed() -> list[dict]:
    url = "https://star.med.br/eventos-e-congressos-de-medicina/"
    soup = fetch_soup(url)
    items = []
    table = soup.find("table")
    if table:
        for tr in table.find_all("tr")[1:]:
            cols = [clean_text(c.get_text(" ", strip=True)) for c in tr.find_all("td")]
            if len(cols) >= 4:
                data_str = cols[2] if "2027" in cols[2] else f"{cols[2]} de 2027"
                items.append({"nome": cols[0], "data": data_str, "local": cols[3], "tema": cols[1], "fonte": "star.med.br"})
    return items


def scrape_querocongressos() -> list[dict]:
    url = "https://querocongressos.com.br/eventos-previstos/"
    soup = fetch_soup(url)
    items = []
    for sec in soup.find_all("section", class_="wpk-agenda-month"):
        h2 = sec.find("h2")
        month_year = clean_text(h2.get_text(" ", strip=True)) if h2 else ""
        year_m = re.search(r"(202[6-9])", month_year)
        year = year_m.group(1) if year_m else "2027"
        for art in sec.find_all("article", class_="wpk-agenda-item"):
            h3 = art.find("h3")
            if not h3:
                continue
            title = clean_text(h3.get_text(" ", strip=True))
            lines = [clean_text(x) for x in art.get_text("\n", strip=True).split("\n") if clean_text(x)]
            day_str = lines[0] if lines else ""
            mon_str = lines[1] if len(lines) > 1 else ""
            data_str = f"{day_str} {mon_str} {year}".strip()
            local = ""
            for ln in lines:
                if re.match(r"^[A-Za-zÀ-ÿ\s.\-]+/[A-Z]{2}$", ln) or ln.lower() in ("virtual", "online"):
                    local = ln
                    break
            items.append({"nome": title, "data": data_str, "local": local, "tema": "", "fonte": "querocongressos.com.br"})
    return items


def scrape_medicinahub() -> list[dict]:
    url = "https://www.medicinahub.com.br/medicinabrasil/congressos"
    soup = fetch_soup(url)
    items = []
    seen_href = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/medicinabrasil/congressos/" not in href or href in seen_href:
            continue
        seen_href.add(href)
        card = a.parent.parent if a.parent and a.parent.parent else a.parent
        lines = [clean_text(x) for x in card.get_text("\n", strip=True).split("\n") if clean_text(x)]
        title = clean_text(a.get_text(" ", strip=True))
        if not title or title not in lines:
            continue
        idx = lines.index(title)
        tema = lines[idx - 1] if idx > 0 else ""
        local = lines[idx + 1] if len(lines) > idx + 1 else ""
        ini, fim = "", ""
        for i, ln in enumerate(lines):
            if ln == "Início" and i + 2 < len(lines) and lines[i + 1] == ":":
                ini = lines[i + 2]
            elif ln == "Fim" and i + 2 < len(lines) and lines[i + 1] == ":":
                fim = lines[i + 2]
        data_str = f"{ini} a {fim}" if ini and fim else ini
        items.append({"nome": title, "data": data_str, "local": local, "tema": tema, "fonte": "medicinahub.com.br"})
    return items


def scrape_medsearch() -> list[dict]:
    url = "https://medsearch.app/congressos"
    soup = fetch_soup(url)
    items = []
    for h3 in soup.find_all("h3"):
        title = clean_text(h3.get_text(" ", strip=True))
        card = h3.find_parent("a")
        if not card:
            continue
        lines = [clean_text(x) for x in card.get_text("\n", strip=True).split("\n") if clean_text(x)]
        if title not in lines:
            continue
        idx = lines.index(title)
        data_str, local = "", ""
        tag_start = len(lines)
        for j in range(idx + 1, len(lines)):
            ln = lines[j]
            if not data_str and re.search(r"\b202[6-9]\b", ln):
                data_str = ln
            elif data_str and not local and ("·" in ln or ln.lower() in ("online", "virtual", "a definir")):
                local = ln.replace(" · ", "/")
                tag_start = j + 1
                break
        tags = []
        for t in lines[tag_start:]:
            if t == "+" or t.isdigit():
                break
            if t == "tidisciplinar":
                t = "Multidisciplinar"
            tags.append(t)
        items.append({"nome": title, "data": data_str, "local": local, "tema": ", ".join(tags), "fonte": "medsearch.app"})
    return items


def scrape_bibliomed() -> list[dict]:
    url = "https://www.bibliomed.com.br/congresses/congress.cfm?cng_id=12030"
    soup = fetch_soup(url)
    title_el = soup.find("title")
    title = clean_text(title_el.get_text().split("|")[-1]) if title_el else "AAIC 2027"
    table = soup.find("table")
    fields = {}
    if table:
        for tr in table.find_all("tr"):
            cells = [clean_text(c.get_text(" ", strip=True)) for c in tr.find_all(["td", "th"])]
            if len(cells) >= 2:
                fields[cells[0].rstrip(":")] = cells[1]
    ini, fim = fields.get("Começa", ""), fields.get("Termina", "")
    data_str = f"{ini} a {fim}" if ini and fim else ini
    local = fields.get("Cidade", "")
    tema = fields.get("Especialidade", "")
    return [{
        "nome": title,
        "data": data_str,
        "local": local,
        "tema": tema if tema and tema != "Outra especialidade" else "Neurologia, Doença de Alzheimer",
        "fonte": "bibliomed.com.br",
    }]


# ---------- Deduplicação ----------

def norm_tokens(name: str) -> set[str]:
    s = strip_accents(name.lower())
    s = re.sub(r"\b\d+[oºª°]?\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return {w for w in s.split() if len(w) >= 2 and w not in STOPWORDS and not ROMAN_RE.match(w)}


def extract_acronyms(name: str) -> set[str]:
    raw = re.findall(r"\b[A-Z]{2,}[A-Za-z0-9.\-]*\b", name)
    res = set()
    for r in raw:
        r_clean = re.sub(r"[^A-Z0-9]", "", r.upper())
        if ROMAN_RE.match(r_clean):
            continue
        r_base = re.sub(r"(20)?2[678]$", "", r_clean)
        if r_base and r_base not in GENERIC_ACRONYMS and not ROMAN_RE.match(r_base) and len(r_base) >= 3:
            res.add(r_base)
            if r_base.startswith("C") and len(r_base) >= 4 and r_base[1:] in ("SBD",):
                res.add(r_base[1:])
    return res


def dates_compatible(d1: tuple[int, int, int, int], d2: tuple[int, int, int, int]) -> bool:
    y1, m1, s1, e1 = d1
    y2, m2, s2, e2 = d2
    if y1 != y2:
        return False
    if m1 == 99 or m2 == 99:
        return True
    if abs(m1 - m2) > 1:
        return False
    if m1 == m2 and s1 != 99 and s2 != 99:
        if e1 + 1 < s2 or e2 + 1 < s1:
            return False
    return True


def same_location(l1: str, l2: str) -> bool:
    a, b = strip_accents(l1.lower()), strip_accents(l2.lower())
    if not a or not b or "definir" in a or "definir" in b or "divulgar" in a or "divulgar" in b:
        return False
    if ("virtual" in a or "online" in a) and ("virtual" in b or "online" in b):
        return True
    ca = re.split(r"[,/\-·(]", a)[0].strip()
    cb = re.split(r"[,/\-·(]", b)[0].strip()
    if ca and cb and len(ca) >= 3 and len(cb) >= 3 and (ca in cb or cb in ca):
        return True
    uf1 = re.search(r"\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b", l1.upper())
    uf2 = re.search(r"\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b", l2.upper())
    return bool(uf1 and uf2 and uf1.group(1) == uf2.group(1) and (len(ca) <= 2 or len(cb) <= 2))


def is_same_event(a: dict, b: dict) -> bool:
    na = re.sub(r"[^a-z0-9 ]", " ", strip_accents(a["nome"].lower()))
    nb = re.sub(r"[^a-z0-9 ]", " ", strip_accents(b["nome"].lower()))
    na = re.sub(r"\s+", " ", na).strip()
    nb = re.sub(r"\s+", " ", nb).strip()
    if na == nb:
        return True

    da = parse_date_info(a["data"])
    db = parse_date_info(b["data"])
    if not dates_compatible(da, db):
        return False

    aa, ab = extract_acronyms(a["nome"]), extract_acronyms(b["nome"])
    if aa & ab:
        return True

    ta, tb = norm_tokens(a["nome"]), norm_tokens(b["nome"])
    inter = ta & tb
    union = ta | tb
    jaccard = len(inter) / len(union) if union else 0.0

    if jaccard >= 0.60 and len(inter) >= 2:
        return True
    if len(inter) >= 2 and (ta <= tb or tb <= ta):
        return True
    if len(ta) == 1 and ta == tb:
        return True

    same_exact_start = (da[0] == db[0] and da[1] == db[1] and da[2] == db[2] and da[1] != 99 and da[2] != 99)
    if same_exact_start and same_location(a["local"], b["local"]) and inter:
        if ta <= tb or tb <= ta or len(inter) >= 2:
            return True
        if ("brazilian lymphoma" in na and "brazilian lymphoma" in nb) or ("tireoide" in na and "thyroid" in nb) or ("tireoide" in nb and "thyroid" in na):
            return True

    if ("congresso brasileiro" in na and "congresso brasileiro" in nb) and (da[1] == 99 or db[1] == 99):
        if (len(ta) >= 1 and ta <= tb) or (len(tb) >= 1 and tb <= ta):
            return True

    return False


def choose_better(cur: str, new: str) -> str:
    cur, new = clean_text(cur), clean_text(new)
    if not cur:
        return new
    if not new:
        return cur
    cur_vague = any(k in cur.lower() for k in ("definir", "não divulgad", "confirmar", "divulgar", "pendente"))
    new_vague = any(k in new.lower() for k in ("definir", "não divulgad", "confirmar", "divulgar", "pendente"))
    if cur_vague and not new_vague:
        return new
    if new_vague and not cur_vague:
        return cur
    return new if len(new) > len(cur) and len(new) <= 120 else cur


def choose_better_tema(cur: str, new: str) -> str:
    cur, new = clean_text(cur), clean_text(new)
    if not cur or cur == "A confirmar":
        return new or "A confirmar"
    if not new or new == "A confirmar":
        return cur
    if len(cur) > 65 and len(new) <= 65:
        return new
    if len(new) > 65 and len(cur) <= 65:
        return cur
    return cur if len(cur) >= len(new) else new


def deduplicate(records: list[dict]) -> list[dict]:
    merged: list[dict] = []
    for rec in records:
        if not rec["nome"]:
            continue
        matched = None
        for m in merged:
            if is_same_event(m, rec):
                matched = m
                break
        if matched:
            matched["nome"] = choose_better(matched["nome"], rec["nome"])
            matched["data"] = choose_better(matched["data"], rec["data"])
            matched["local"] = choose_better(matched["local"], rec["local"])
            matched["tema"] = choose_better_tema(matched["tema"], rec["tema"])
            if rec["fonte"] not in matched["fontes"]:
                matched["fontes"].append(rec["fonte"])
        else:
            merged.append({
                "nome": rec["nome"],
                "data": rec["data"] or "A definir",
                "local": rec["local"] or "A definir",
                "tema": rec["tema"] or "A confirmar",
                "fontes": [rec["fonte"]],
            })
    merged.sort(key=lambda x: (parse_date_info(x["data"]), x["nome"].lower()))
    return merged


# ---------- Padronização PostgreSQL ----------

def standardize_date(raw: str) -> tuple[str | None, str | None, str, str | None]:
    """Converte data bruta em (data_inicio ISO, data_fim ISO, data_status, data_observacao)."""
    raw_clean = clean_text(raw)
    obs = None
    m_paren = re.search(r"\(([^)]+)\)", raw_clean)
    if m_paren:
        obs_txt = clean_text(m_paren.group(1))
        obs = obs_txt[0].upper() + obs_txt[1:] if obs_txt else None

    # Normaliza ordinais (1º -> 1) antes de strip_accents, pois NFKD transforma 'º' em 'o'
    s_no_ord = re.sub(r"(\d+)[º°ª]", r"\1", raw_clean)
    s = strip_accents(s_no_ord.lower())
    status = "confirmada"
    if "definir" in s or "nao divulgad" in s or "pendente" in s:
        status = "a_definir"
        return (None, None, status, obs or raw_clean)
    if "confirmar" in s:
        status = "a_confirmar"

    base = re.sub(r"\([^)]*\)", "", s).strip()
    year_m = re.search(r"(202[6-9])", base)
    year = int(year_m.group(1)) if year_m else 2027

    # 1) DD/MM/YYYY a DD/MM/YYYY ou DD/MM -> DD/MM/YYYY
    m_slash_full = re.findall(r"(\d{1,2})/(\d{1,2})/(202[6-9])", base)
    if len(m_slash_full) >= 2:
        d1, m1, y1 = map(int, m_slash_full[0])
        d2, m2, y2 = map(int, m_slash_full[-1])
        return (dt.date(y1, m1, d1).isoformat(), dt.date(y2, m2, d2).isoformat(), status, obs)

    m_cross_slash = re.search(r"(\d{1,2})/(\d{1,2})\s*[–\-→a]+\s*(\d{1,2})/(\d{1,2})(?:/(202[6-9]))?", base)
    if m_cross_slash:
        d1, m1 = int(m_cross_slash.group(1)), int(m_cross_slash.group(2))
        d2, m2 = int(m_cross_slash.group(3)), int(m_cross_slash.group(4))
        y = int(m_cross_slash.group(5)) if m_cross_slash.group(5) else year
        return (dt.date(y, m1, d1).isoformat(), dt.date(y, m2, d2).isoformat(), status, obs)

    # 2) Dois meses por extenso: "31 de outubro a 5 de novembro de 2027"
    month_pattern = "|".join(sorted(MONTHS_PT.keys(), key=len, reverse=True))
    m_two_months = re.search(
        rf"(\d{{1,2}})[º°]?\s*(?:de\s*)?({month_pattern})\.?\s*(?:de\s*(202[6-9])\s*)?(?:a|e|–|-|→)\s*(\d{{1,2}})[º°]?\s*(?:de\s*)?({month_pattern})\.?(?:\s*(?:de\s*)?(202[6-9]))?",
        base,
    )
    if m_two_months:
        d1, mn1, y1, d2, mn2, y2 = m_two_months.groups()
        y_start = int(y1) if y1 else (int(y2) if y2 else year)
        y_end = int(y2) if y2 else y_start
        return (
            dt.date(y_start, MONTHS_PT[mn1], int(d1)).isoformat(),
            dt.date(y_end, MONTHS_PT[mn2], int(d2)).isoformat(),
            status,
            obs,
        )

    # 3) Mesmo mês: "25–28 de nov. de 2026", "1º a 5 de maio de 2027", "29 ABR 2027"
    m_same_month = re.search(
        rf"(\d{{1,2}})[º°]?(?:\s*(?:[–\-→]|a|e)\s*(\d{{1,2}})[º°]?)?\s*(?:de\s*)?({month_pattern})\.?(?:\s*(?:de\s*)?(202[6-9]))?",
        base,
    )
    if m_same_month:
        d1, d2, mn, y_opt = m_same_month.groups()
        y = int(y_opt) if y_opt else year
        m = MONTHS_PT[mn]
        start = dt.date(y, m, int(d1))
        end = dt.date(y, m, int(d2)) if d2 else start
        return (start.isoformat(), end.isoformat(), status, obs)

    return (None, None, "a_definir", obs or raw_clean)


def standardize_location(raw: str) -> tuple[str, str | None, str | None, str | None, str]:
    """Retorna (modalidade, cidade, estado_uf, pais, local_formatado)."""
    s = clean_text(raw)
    low = strip_accents(s.lower())

    if not s or any(k in low for k in ("definir", "divulgar", "pendente")):
        return ("a_definir", None, None, None, "A definir")

    if low in ("virtual", "online", "on-line"):
        return ("online", None, None, None, "Online")

    modalidade = "presencial"
    if "on-line" in low or "online" in low or "virtual" in low:
        modalidade = "hibrido"
        s = re.sub(r"\s+e\s+on-?line\b", "", s, flags=re.I).strip()

    if strip_accents(s.lower()) == "brasil":
        return (modalidade, None, None, "Brasil", "Brasil (cidade a definir)")

    if s.upper() in UF_SET:
        uf = s.upper()
        return (modalidade, None, uf, "Brasil", f"{uf} - Brasil")

    # Remove sufixo de local específico após vírgula quando precedido por UF (ex.: "São Paulo (SP), São Paulo Expo")
    s_no_venue = re.sub(r"^(.+?\([A-Z]{2}\))\s*,.*$", r"\1", s)

    # Padrão brasileiro: "Cidade (UF)" ou "Cidade / UF" ou "Cidade/UF"
    m_br = re.match(r"^(.+?)\s*(?:\(([A-Z]{2})\)|/\s*([A-Z]{2}))$", s_no_venue)
    if m_br:
        city = clean_text(m_br.group(1))
        uf = (m_br.group(2) or m_br.group(3)).upper()
        if uf in UF_SET:
            return (modalidade, city, uf, "Brasil", f"{city}, {uf} - Brasil")

    # Padrão internacional: "Cidade (País)" ou "Cidade/País"
    m_intl = re.match(r"^(.+?)\s*(?:\(([^)]+)\)|/\s*([^/]+))$", s_no_venue)
    if m_intl:
        city = clean_text(m_intl.group(1))
        country_raw = clean_text(m_intl.group(2) or m_intl.group(3))
        country = COUNTRY_MAP.get(strip_accents(country_raw.lower()), country_raw)
        city = CITY_ALIASES.get(strip_accents(city.lower()), city)
        suffix = " (Híbrido)" if modalidade == "hibrido" else ""
        return (modalidade, city, None, country, f"{city}, {country}{suffix}")

    # Caso especial: "Chicago Estados Unidos da América"
    for key, country in COUNTRY_MAP.items():
        m_tail = re.match(rf"^(.+?)\s+{re.escape(key)}$", strip_accents(s_no_venue.lower()))
        if m_tail:
            city_len = len(m_tail.group(1))
            city = clean_text(s_no_venue[:city_len])
            return (modalidade, city, None, country, f"{city}, {country}")

    return (modalidade, s_no_venue, None, None, s_no_venue)


def standardize_themes(raw: str) -> tuple[str, list[str]]:
    """Retorna (tema_principal, lista_temas_padronizados)."""
    s = clean_text(raw)
    if not s or strip_accents(s.lower()) in ("a confirmar", "nao informado"):
        return ("Não informado", [])

    parts = [clean_text(p) for p in s.split(",") if clean_text(p)]
    normalized: list[str] = []
    for p in parts:
        p = re.sub(r"^com foco em\s+", "", p, flags=re.I)
        key = strip_accents(p.lower())
        canon = THEME_ALIASES.get(key, p)
        if canon not in normalized:
            normalized.append(canon)

    if not normalized:
        return ("Não informado", [])
    if normalized[0] == "Multidisciplinar" and len(normalized) > 1:
        return (normalized[1], normalized)
    return (normalized[0], normalized)


def make_slug(nome: str, data_inicio: str | None, seen: set[str]) -> str:
    year_m = re.search(r"(202[6-9])", nome)
    year = (data_inicio[:4] if data_inicio else (year_m.group(1) if year_m else "2027"))
    base = strip_accents(nome.lower())
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    if not base.endswith(year):
        base = f"{base}-{year}"
    base = base[:90].rstrip("-")
    slug = base
    n = 2
    while slug in seen:
        slug = f"{base}-{n}"
        n += 1
    seen.add(slug)
    return slug


def sql_literal(val: str | None) -> str:
    if val is None:
        return "NULL"
    return "'" + val.replace("'", "''") + "'"


def sql_array(vals: list[str]) -> str:
    if not vals:
        return "'{}'::TEXT[]"
    return "ARRAY[" + ", ".join(sql_literal(v) for v in vals) + "]::TEXT[]"


def build_postgres_rows(dedup: list[dict]) -> list[dict]:
    seen_slugs: set[str] = set()
    rows = []
    for r in dedup:
        d_ini, d_fim, d_status, d_obs = standardize_date(r["data"])
        mod, cidade, uf, pais, local_fmt = standardize_location(r["local"])
        tema_principal, temas = standardize_themes(r["tema"])
        slug = make_slug(r["nome"], d_ini, seen_slugs)
        rows.append({
            "slug": slug,
            "nome": r["nome"],
            "data_inicio": d_ini,
            "data_fim": d_fim,
            "data_status": d_status,
            "data_observacao": d_obs,
            "modalidade": mod,
            "cidade": cidade,
            "estado_uf": uf,
            "pais": pais,
            "local_formatado": local_fmt,
            "tema_principal": tema_principal,
            "temas": temas,
            "fontes": r["fontes"],
        })
    rows.sort(key=lambda x: (x["data_inicio"] or "9999-12-31", x["nome"].lower()))
    return rows


def write_sql(rows: list[dict], sql_path: Path) -> None:
    lines = [
        "-- Script idempotente para PostgreSQL (DDL + UPSERT)",
        "BEGIN;",
        "",
        "CREATE TABLE IF NOT EXISTS congressos (",
        "    id BIGSERIAL PRIMARY KEY,",
        "    slug TEXT NOT NULL UNIQUE,",
        "    nome TEXT NOT NULL,",
        "    data_inicio DATE,",
        "    data_fim DATE,",
        "    data_status TEXT NOT NULL CHECK (data_status IN ('confirmada', 'a_confirmar', 'a_definir')),",
        "    data_observacao TEXT,",
        "    modalidade TEXT NOT NULL CHECK (modalidade IN ('presencial', 'online', 'hibrido', 'a_definir')),",
        "    cidade TEXT,",
        "    estado_uf CHAR(2),",
        "    pais TEXT,",
        "    local_formatado TEXT NOT NULL,",
        "    tema_principal TEXT NOT NULL,",
        "    temas TEXT[] NOT NULL DEFAULT '{}',",
        "    fontes TEXT[] NOT NULL DEFAULT '{}',",
        "    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),",
        "    CONSTRAINT chk_congressos_datas CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)",
        ");",
        "",
        "CREATE INDEX IF NOT EXISTS idx_congressos_data_inicio ON congressos (data_inicio);",
        "CREATE INDEX IF NOT EXISTS idx_congressos_estado_uf ON congressos (estado_uf);",
        "CREATE INDEX IF NOT EXISTS idx_congressos_tema_principal ON congressos (tema_principal);",
        "CREATE INDEX IF NOT EXISTS idx_congressos_temas_gin ON congressos USING GIN (temas);",
        "",
        "ALTER TABLE congressos ENABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS \"Leitura pública de congressos\" ON congressos;",
        "CREATE POLICY \"Leitura pública de congressos\" ON congressos FOR SELECT TO anon, authenticated USING (true);",
        "",
    ]

    for r in rows:
        d_ini_sql = f"{sql_literal(r['data_inicio'])}::DATE" if r["data_inicio"] else "NULL"
        d_fim_sql = f"{sql_literal(r['data_fim'])}::DATE" if r["data_fim"] else "NULL"
        uf_sql = f"{sql_literal(r['estado_uf'])}::CHAR(2)" if r["estado_uf"] else "NULL"
        lines.append(
            "INSERT INTO congressos "
            "(slug, nome, data_inicio, data_fim, data_status, data_observacao, modalidade, cidade, estado_uf, pais, local_formatado, tema_principal, temas, fontes) "
            f"VALUES ({sql_literal(r['slug'])}, {sql_literal(r['nome'])}, {d_ini_sql}, {d_fim_sql}, "
            f"{sql_literal(r['data_status'])}, {sql_literal(r['data_observacao'])}, {sql_literal(r['modalidade'])}, "
            f"{sql_literal(r['cidade'])}, {uf_sql}, {sql_literal(r['pais'])}, {sql_literal(r['local_formatado'])}, "
            f"{sql_literal(r['tema_principal'])}, {sql_array(r['temas'])}, {sql_array(r['fontes'])})\n"
            "ON CONFLICT (slug) DO UPDATE SET\n"
            "    nome = EXCLUDED.nome,\n"
            "    data_inicio = EXCLUDED.data_inicio,\n"
            "    data_fim = EXCLUDED.data_fim,\n"
            "    data_status = EXCLUDED.data_status,\n"
            "    data_observacao = EXCLUDED.data_observacao,\n"
            "    modalidade = EXCLUDED.modalidade,\n"
            "    cidade = EXCLUDED.cidade,\n"
            "    estado_uf = EXCLUDED.estado_uf,\n"
            "    pais = EXCLUDED.pais,\n"
            "    local_formatado = EXCLUDED.local_formatado,\n"
            "    tema_principal = EXCLUDED.tema_principal,\n"
            "    temas = EXCLUDED.temas,\n"
            "    fontes = EXCLUDED.fontes,\n"
            "    atualizado_em = NOW();"
        )

    lines.extend(["", "COMMIT;", ""])
    sql_path.write_text("\n".join(lines), encoding="utf-8")


def main():
    scrapers = [
        ("usebip.com", scrape_usebip),
        ("agenciadomedico.com.br", scrape_agenciadomedico),
        ("tivita.com", scrape_tivita),
        ("agrupamed.com.br", scrape_agrupamed),
        ("star.med.br", scrape_starmed),
        ("querocongressos.com.br", scrape_querocongressos),
        ("medicinahub.com.br", scrape_medicinahub),
        ("medsearch.app", scrape_medsearch),
        ("bibliomed.com.br", scrape_bibliomed),
    ]

    all_records = []
    stats = []
    for label, fn in scrapers:
        try:
            rows = fn()
            stats.append((label, len(rows), "OK"))
            all_records.extend(rows)
        except Exception as exc:
            stats.append((label, 0, f"ERRO: {exc}"))

    dedup = deduplicate(all_records)
    pg_rows = build_postgres_rows(dedup)
    now_iso = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

    out_dir = Path(__file__).resolve().parent

    # 1. CSV pronto para COPY no PostgreSQL (NULL como string vazia)
    csv_path = out_dir / "congressos_deduplicados.csv"
    csv_cols = [
        "slug", "nome", "data_inicio", "data_fim", "data_status", "data_observacao",
        "modalidade", "cidade", "estado_uf", "pais", "local_formatado",
        "tema_principal", "temas", "fontes", "atualizado_em",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(csv_cols)
        for r in pg_rows:
            writer.writerow([
                r["slug"],
                r["nome"],
                r["data_inicio"] or "",
                r["data_fim"] or "",
                r["data_status"],
                r["data_observacao"] or "",
                r["modalidade"],
                r["cidade"] or "",
                r["estado_uf"] or "",
                r["pais"] or "",
                r["local_formatado"],
                r["tema_principal"],
                "{" + ",".join(f'"{t}"' for t in r["temas"]) + "}",
                "{" + ",".join(f'"{fn}"' for fn in r["fontes"]) + "}",
                now_iso,
            ])

    # 2. SQL idempotente (DDL + UPSERT) para PostgreSQL
    sql_path = out_dir / "congressos.sql"
    write_sql(pg_rows, sql_path)

    # 3. Tabela Markdown padronizada
    md_path = out_dir / "congressos_deduplicados.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Calendário Consolidado de Congressos Médicos (Padronizado / PostgreSQL-Ready)\n\n")
        f.write("## Resumo da Coleta por Fonte\n\n")
        f.write("| Fonte | Registros extraídos | Status |\n|---|---:|---|\n")
        for label, count, status in stats:
            f.write(f"| {label} | {count} | {status} |\n")
        f.write(f"\n**Total bruto:** {len(all_records)} | **Total deduplicado:** {len(pg_rows)}\n\n")
        f.write("## Tabela Padronizada\n\n")
        f.write("| # | Congresso | data_inicio | data_fim | data_status | modalidade | local_formatado | tema_principal | temas | fontes |\n")
        f.write("|---:|---|---|---|---|---|---|---|---|---|\n")
        for idx, r in enumerate(pg_rows, 1):
            nome = r["nome"].replace("|", "\\|")
            d_ini = r["data_inicio"] or "NULL"
            d_fim = r["data_fim"] or "NULL"
            local_fmt = r["local_formatado"].replace("|", "\\|")
            tema_p = r["tema_principal"].replace("|", "\\|")
            temas_str = (", ".join(r["temas"]) or "—").replace("|", "\\|")
            fontes = ", ".join(r["fontes"])
            f.write(
                f"| {idx} | {nome} | {d_ini} | {d_fim} | {r['data_status']} | "
                f"{r['modalidade']} | {local_fmt} | {tema_p} | {temas_str} | {fontes} |\n"
            )

    print("Coleta e padronização concluídas:")
    for label, count, status in stats:
        print(f"  - {label}: {count} ({status})")
    print(f"Total bruto: {len(all_records)} -> Deduplicado: {len(pg_rows)}")
    print(f"Arquivos gerados: {csv_path.name}, {sql_path.name}, {md_path.name}")


if __name__ == "__main__":
    main()
