import re
def clean(t):
    t = re.sub(r'\{\{efn[^{}]*(?:\{\{[^{}]*\}\}[^{}]*)*\}\}', '', t)
    t = re.sub(r'\{\{refn[^{}]*\}\}', '', t)
    t = re.sub(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>', '', t, flags=re.S)
    t = re.sub(r'<br\s*/?>', ' ', t)
    t = re.sub(r'\{\{Sort\|[^|]*\|(.*?)\}\}', r'\1', t)
    t = re.sub(r'\{\{(?:Abbr|abbr)\|([^|}]*)\|[^}]*\}\}', r'\1', t)
    t = re.sub(r'\{\{Start date\|(\d{4})(?:\|(\d+))?(?:\|(\d+))?[^}]*\}\}', lambda m: m.group(1)+('-%02d'%int(m.group(2)) if m.group(2) else ''), t)
    t = re.sub(r'\{\{Date table sorting\|(\d{4})\|(\w+)[^}]*\}\}', r'\2 \1', t)
    t = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', t)
    t = re.sub(r'\{\{[^{}]*\}\}', '', t)
    t = t.replace("''", '').replace('’', "'").replace('‘', "'").replace('&nbsp;',' ')
    return re.sub(r'\s+', ' ', t).strip()

def tables(text):
    return re.findall(r'\{\|.*?\n\|\}', text, re.S)

def parse(tab):
    """Return list of rows (list of cleaned cell strings), header rows skipped except '! N' row headers kept as first cell. Handles rowspan."""
    rows = []; pending = {}  # col -> (val, remaining)
    for block in re.split(r'\n\|-[^\n]*', tab)[1:]:
        cells = []
        for line in block.split('\n'):
            if not line.strip() or line.startswith('|}') or line.startswith('|+'): continue
            if line[0] in '!|':
                kind = line[0]
                parts = re.split(r'\|\||!!', line[1:])
                for p in parts: cells.append((kind, p))
            elif cells:
                k, p = cells[-1]; cells[-1] = (k, p + ' ' + line)
        if not cells: continue
        if all(k == '!' for k, _ in cells) and len(cells) > 1: continue  # header row
        out = []; col = 0; it = iter(cells)
        raw = list(cells); i = 0
        while i < len(raw) or col in pending:
            if col in pending:
                v, n = pending[col]; out.append(v)
                if n - 1 > 0: pending[col] = (v, n - 1)
                else: del pending[col]
                col += 1; continue
            k, p = raw[i]; i += 1
            m = re.match(r'\s*((?:[a-z\-]+=(?:"[^"]*"|[^\s|"]+)\s*)+)(?:\|(?!\|)|(?=\{\{))(.*)$', p, re.S)
            attrs, val = (m.group(1), m.group(2)) if m and not p.strip().startswith('[[') and not p.strip().startswith("''") else ('', p)
            rs = re.search(r'rowspan="?(\d+)', attrs)
            v = clean(val); out.append(v)
            if rs and int(rs.group(1)) > 1: pending[col] = (v, int(rs.group(1)) - 1)
            col += 1
        rows.append(out)
    return rows
