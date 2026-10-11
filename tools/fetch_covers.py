"""Build-time Open Library cover matcher. Polite: 1 req/sec, cached on disk, identifies itself.
Uses search.json + works/<id>/editions.json only (no Covers API crawling). Output: tools/covers.json"""
import json, re, time, urllib.request, urllib.parse, hashlib, os, sys
UA = 'NancyShelf/1.0 (personal book-catalog app; https://github.com/alanadkinstn-hub/nancydrew)'
CACHE = '/workspace/nancydrew/tools/olcache'
data = json.load(open('/workspace/nancydrew/tools/data.json'))
last = [0.0]
def get(url):
    fn = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + '.json')
    if os.path.exists(fn): return json.load(open(fn))
    wait = 1.05 - (time.time() - last[0])
    if wait > 0: time.sleep(wait)
    for attempt in range(4):
        try:
            last[0] = time.time()
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as r:
                d = json.load(r); json.dump(d, open(fn, 'w')); return d
        except Exception as e:
            print('  retry', attempt, e, file=sys.stderr); time.sleep(5 * (attempt + 1))
    return None

def norm(t):
    t = t.lower().replace('&', 'and').replace('’', "'")
    t = re.sub(r'\(.*?\)|\[.*?\]', ' ', t)          # drop "(Hardy Boys, Book 7)" etc
    t = re.split(r'\s*[:;]\s*(?:a )?nancy drew|\s*/\s*', t)[0]
    t = re.sub(r'^nancy drew\s*[:#-]?\s*(?:#?\d+\s*[:-]?\s*)?', '', t)
    t = re.sub(r"[^a-z0-9 ]", ' ', t)
    t = re.sub(r'^(the|a|an) ', '', t.strip())
    return re.sub(r'\s+', ' ', t).strip()

def year_of(e):
    m = re.search(r'(1[89]\d\d|20\d\d)', e.get('publish_date', '') or ''); return int(m.group(1)) if m else None

def nums_in(e):
    txt = ' '.join((e.get('series') or []) + [e.get('title', ''), e.get('subtitle', '') or ''])
    if 'nancy drew' not in txt.lower(): return set()
    return set(int(x) for x in re.findall(r'(?:#|no\.?\s*|book\s+|volume\s+|\(|--\s*|;\s*)(\d{1,3})\b', txt, re.I))

BAD_PUB = re.compile(r'armada|collins|books on tape|listening library|audio|recorded|random house audio|brilliance|oakhill', re.I)
BAD_FMT = re.compile(r'audio|cassette|cd|electronic|ebook|e-book|microform|braille|large print', re.I)
FOREIGN = re.compile(r'[àáâãäåçèéêëìíîïñòóôõöùúûüß]|\b(de|der|die|das|les|el|los|la|il|het)\b', re.I)

SERIES_PUB = {
 'gd': (re.compile(r'grosset|grossett|applewood', re.I), None),
 'digest': (re.compile(r'wanderer|minstrel|simon|aladdin|pocket|grosset', re.I), (-1, 4)),
 'files': (re.compile(r'archway|simon|pocket', re.I), (-1, 3)),
 'sm88': (re.compile(r'archway|simon|pocket', re.I), (-1, 3)),
 'beadet': (re.compile(r'wanderer|simon', re.I), None),
 'notebooks': (re.compile(r'minstrel|simon|pocket|aladdin', re.I), None),
 'girldet': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'gdsuper': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'cluecrew': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'sm07': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'diaries': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'cluebook': (re.compile(r'aladdin|simon', re.I), (-1, 3)),
 'specials': (re.compile(r'grosset|wanderer|simon|aladdin|minstrel', re.I), None),
}
# titles that appear in more than one of our series: need explicit number match or year window
from collections import Counter
tcount = Counter(norm(b['t']) for s in data for b in s['books'])

def pick(series_key, b):
    target = norm(b['t'])
    if len(target) < 3: return None, 'short'
    who = 'Carolyn Keene'
    sr = get('https://openlibrary.org/search.json?' + urllib.parse.urlencode({'title': b['t'], 'q': 'nancy drew', 'fields': 'key,title,edition_count', 'limit': 10}))
    if not sr or not sr.get('docs'):
        sr = get('https://openlibrary.org/search.json?' + urllib.parse.urlencode({'title': b['t'], 'author': who, 'fields': 'key,title,edition_count', 'limit': 10}))
    if not sr: return None, 'search failed'
    cands = [d for d in sr.get('docs', []) if norm(d['title']) == target]
    cands.sort(key=lambda d: -d.get('edition_count', 0))
    pubre, win = SERIES_PUB[series_key]
    dup = tcount[target] > 1
    for d in cands[:3]:
        ed = get(f"https://openlibrary.org{d['key']}/editions.json?limit=200")
        if not ed: continue
        eds = ed.get('entries', [])
        hardy = any('nancy drew' in (' '.join(e.get('series') or []) + ' ' + e.get('title', '') + ' ' + (e.get('subtitle') or '')).lower() for e in eds)
        if not hardy: continue
        allnums = set().union(*[nums_in(e) for e in eds if not BAD_PUB.search(' '.join(e.get('publishers') or []))]) if eds else set()
        good = []
        for e in eds:
            pubs = ' '.join(e.get('publishers') or [])
            if not e.get('covers') or not [c for c in e['covers'] if c and c > 0]: continue
            if BAD_PUB.search(pubs) or BAD_FMT.search(e.get('physical_format') or ''): continue
            if FOREIGN.search(e.get('title', '')): continue
            if norm(e.get('title', '')) != target and not norm(e.get('title', '')).startswith(target) and 'nancy drew' not in e.get('title', '').lower(): continue
            if not pubre.search(pubs): continue
            y = year_of(e); ns = nums_in(e)
            if ns and b['n'] not in ns: continue            # edition says it's a different number
            if win and b.get('y') and (y is None or not (b['y'] + win[0] <= y <= b['y'] + win[1])): continue
            if dup and not (b['n'] in ns or (win and y)): continue
            good.append((e, y, ns))
        if not good: continue
        # numbered evidence somewhere in this work (US eds) unless the title is unique and year-windowed
        if b['n'] not in allnums and not any(b['n'] in ns for _, _, ns in good) and (dup or not win):
            if series_key not in ('beadet', 'specials', 'notebooks'): continue
        res = {'work': d['key'].split('/')[-1]}
        def mk(e, y):
            return {'id': [c for c in e['covers'] if c and c > 0][0], 'ed': e['key'].split('/')[-1], 'yr': y,
                    'pub': re.sub(r'\s+', ' ', (e.get('publishers') or [''])[0]).strip()[:40]}
        if series_key == 'gd' and b.get('ry'):
            ot = [(e, y) for e, y, _ in good if y and y < b['ry'] and not re.search('applewood', ' '.join(e.get('publishers') or []), re.I)]
            app = [(e, y) for e, y, _ in good if re.search('applewood', ' '.join(e.get('publishers') or []), re.I)]
            rt = [(e, y) for e, y, _ in good if y and y >= b['ry'] and not re.search('applewood', ' '.join(e.get('publishers') or []), re.I)]
            ot.sort(key=lambda t: t[1]); rt.sort(key=lambda t: t[1])
            if ot: res['ot'] = mk(*ot[0])
            elif app: res['ot'] = {**mk(*app[0]), 'fac': 1}
            if rt: res['rt'] = mk(*rt[0])
            if not ot and not app and not rt: continue
        else:
            def score(t):
                e, y, ns = t; s = 0
                if b['n'] in ns: s -= 10
                if y and b.get('y'): s += abs(y - b['y'])
                elif not y: s += 20
                return s
            good.sort(key=score); e, y, _ = good[0]; res['c'] = mk(e, y)
        return res, 'ok'
    return None, 'no confident match' if cands else 'no title match'

if __name__ == '__main__':
    out = {}; stats = {}
    only = sys.argv[1:] or None
    for s in data:
        if only and s['key'] not in only: continue
        hit = 0
        for b in s['books']:
            r, why = pick(s['key'], b)
            if r: out[f"{s['key']}-{b['n']}"] = r; hit += 1
            print(s['key'], b['n'], b['t'], '->', 'OK ' + json.dumps(r) if r else why, flush=True)
        stats[s['key']] = (hit, len(s['books']))
    prev = json.load(open('/workspace/nancydrew/tools/covers.json')) if os.path.exists('/workspace/nancydrew/tools/covers.json') else {}
    if only: prev.update(out); out = prev
    json.dump(out, open('/workspace/nancydrew/tools/covers.json', 'w'), separators=(',', ':'))
    print('STATS', stats)
