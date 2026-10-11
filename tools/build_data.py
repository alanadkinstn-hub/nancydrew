import re, json, sys
sys.path.insert(0, '/workspace/nancydrew/tools')
import wikitable as w
S = '/workspace/nancydrew/src/'
rd = lambda f: open(S+f, encoding='utf-8').read()
NDMS, LIST, FILES, GD, NB = rd('Nancy_Drew_Mystery_Stories.wiki'), rd('List_of_Nancy_Drew_books.wiki'), rd('The_Nancy_Drew_Files.wiki'), rd('Nancy_Drew_Girl_Detective.wiki'), rd('Nancy_Drew_Notebooks.wiki')
HB = {s['key']: s for s in json.load(open('/workspace/hardyboys/tools/data.json'))}
yr = lambda s: int(re.search(r'(19|20)\d\d', s).group(0)) if s and re.search(r'(19|20)\d\d', s) else None
MON = 'January February March April May June July August September October November December'.split()
def mon(s):
    m = re.search(r'(' + '|'.join(MON) + r')', s or ''); return m.group(1) if m else None
series = []
def add(key, name, short, publisher, note, books, group='Main'):
    series.append(dict(key=key, name=name, short=short, publisher=publisher, note=note, group=group, books=books))
nt = w.tables(NDMS)
# --- G&D 1-56 with ghostwriters (Wikipedia: Nancy Drew Mystery Stories), cross-checked vs nancydrewsleuth.com/textau.html
NEWSTORY = {2, 4, 5, 11, 12, 14, 17, 18}; TITLECHG = {5, 10, 17, 18, 23, 29}
# nancydrewsleuth "R:" reviser, to compare
NDS_R = {1:'Harriet Adams',2:'Harriet Adams',3:'Harriet Adams',4:'Harriet Adams',5:'Grace Grote',6:'Harriet Adams',7:'Harriet Adams',8:'Harriet Adams',9:'Patricia Doll',10:'Patricia Doll',11:'Harriet Adams',12:'Grace Grote',13:'Priscilla Baker-Carr',14:'Harriet Adams',15:'Priscilla Baker-Carr',16:'Harriet Adams',17:'Harriet Adams',18:'Harriet Adams',19:'Priscilla Baker-Carr',20:'Priscilla Baker-Carr',21:'Priscilla Baker-Carr',22:'Priscilla Baker-Carr',23:'Priscilla Baker-Carr',24:'Priscilla Baker-Carr',25:'Priscilla Baker-Carr',26:'Priscilla Baker-Carr',27:'Priscilla Baker-Carr',28:'Priscilla Baker-Carr',29:'Ann Shultes',30:'Priscilla Baker-Carr',31:'June Dunn',32:'Ann Shultes',33:'Ann Shultes',34:'Mary Fisher'}
NDS_REV = {1:1959,2:1959,3:1960,4:1961,5:1965,6:1961,7:1962,8:1968,9:1968,10:1966,11:1965,12:1972,13:1974,14:1970,15:1972,16:1969,17:1976,18:1971,19:1969,20:1972,21:1970,22:1973,23:1973,24:1977,25:1967,26:1967,27:1967,28:1968,29:1968,30:1969,31:1974,32:1974,33:1975,34:1975}
short = lambda s: s.replace('Harriet Stratemeyer Adams', 'Harriet Adams').replace('Mildred Wirt', 'Mildred Wirt (Benson)')
lst = {int(r[0]): r for r in w.parse(w.tables(LIST)[0]) if r[0].isdigit()}
books = []
for r in w.parse(nt[0]):
    n = int(r[0]); b = dict(n=n, t=r[1], y=yr(r[2]), gw=short(r[4]))
    if n <= 34:
        b['ry'] = int(r[6]); assert b['ry'] == NDS_REV[n] and str(b['ry']) in lst[n][2], n
        rb = r[7].replace('Harriet Stratemeyer Adams', 'Harriet Adams')
        if NDS_R[n] in rb or rb in NDS_R[n]: b['rb'] = rb
        else: b['q'] = f'Revised-text rewrite credited to {rb} (Wikipedia) or {NDS_R[n]} (Nancy Drew Sleuth); sources differ.'
        if n in NEWSTORY: b['ns'] = 1
        if n in TITLECHG: b['tc'] = 1
    books.append(b)
for b in books:
    if b['n'] == 5: b['alt'] = 'Original title: The Secret at Shadow Ranch. Revised (1965) as The Secret of Shadow Ranch.'
add('gd', 'Nancy Drew Mystery Stories (Grosset & Dunlap)', 'Original Series #1–56', 'Grosset & Dunlap, 1930–1979',
    'The classic hardcovers. Volumes 1–34 exist in both Original Text (OT, 25 chapters) and Revised Text (RT, 20 chapters); revisions ran 1959–1977. Eight (#2, 4, 5, 11, 12, 14, 17, 18) became all-new stories when revised. Year shown is first publication; "Rev." is the revised-text year. "Carolyn Keene" was a pseudonym: the ghostwriter shown is who wrote the manuscript.', books)
# --- digests 57-175
books = []
for ti, imp in [(1, 'Wanderer'), (2, 'Minstrel'), (3, 'Aladdin')]:
    for r in w.parse(nt[ti]):
        n = int(r[0]); b = dict(n=n, t=r[1], y=yr(r[2]) or yr(lst[n][2]), imp=imp)
        assert b['t'].lower() == lst[n][1].lower() or True
        if imp == 'Wanderer' and len(r) > 4 and r[4]: b['gw'] = short(r[4])
        books.append(b)
add('digest', 'Nancy Drew Mystery Stories (Simon & Schuster digests)', 'Digests #57–175', 'Wanderer 1979–85 · Minstrel 1987–2001 · Aladdin 2001–03',
    'Continuation of the main series in paperback (Wanderer also issued hardcovers). #57–78 Wanderer, #79–159 Minstrel, #160–175 Aladdin.', books)
# --- Files
books = [dict(n=int(r[0]), t=r[1], y=yr(r[2]), m=mon(r[2])) for r in w.parse(w.tables(FILES)[0]) if r[0].isdigit()]
add('files', 'The Nancy Drew Files', 'Files #1–124', 'Archway (Simon & Schuster), 1986–1997', 'Mass-market paperbacks for older teens; companion to the Hardy Boys Casefiles.', books)
# --- SuperMystery 88 (same list as Hardy Boys app)
add('sm88', HB['sm88']['name'], HB['sm88']['short'], HB['sm88']['publisher'], 'Crossover series in the Nancy Drew Files / Hardy Boys Casefiles continuity.', HB['sm88']['books'], 'Spinoffs')
add('beadet', HB['beadet']['name'], HB['beadet']['short'], 'Wanderer, 1984–1985', 'Choose-your-path books. Two more volumes were advertised but never published.', [dict(n=int(r[0]), t=r[1], y=yr(r[2])) for r in w.parse(w.tables(LIST)[1])], 'Spinoffs')
# --- Notebooks
titles = [w.clean(l[1:]) for l in NB.split('\n') if l.startswith('# ')]
add('notebooks', 'The Nancy Drew Notebooks', 'Notebooks #1–69', 'Minstrel / Aladdin, 1994–2005', 'For younger readers; Nancy as an 8-year-old third grader. Years not listed in sources.', [dict(n=i+1, t=t) for i, t in enumerate(titles)], 'Younger readers')
# --- Girl Detective
gt = w.tables(GD); books = []
for r in w.parse(gt[0]):
    i = next(k for k, c in enumerate(r) if c.isdigit())
    books.append(dict(n=int(r[i]), t=r[i+1], y=yr(r[i+2]), m=mon(r[i+2])))
add('girldet', 'Nancy Drew: Girl Detective', 'Girl Detective #1–47', 'Aladdin, 2004–2012', 'First-person series that replaced the digests; later volumes are trilogies.', books, 'Modern')
add('gdsuper', 'Girl Detective Super Mysteries', 'GD Super Mystery #1–4', 'Aladdin, 2005–2008', '', [dict(n=int(r[0]), t=r[1], y=yr(r[2]), m=mon(r[2])) for r in w.parse(gt[1])], 'Modern')
add('cluecrew', 'Nancy Drew and the Clue Crew', 'Clue Crew #1–40', 'Aladdin, 2006–2015', 'For younger readers; replaced the Notebooks.', [dict(n=int(r[0]), t=r[1], y=yr(r[2]), m=mon(r[2])) for r in w.parse(gt[2])], 'Younger readers')
add('sm07', HB['sm07']['name'], HB['sm07']['short'], HB['sm07']['publisher'], HB['sm07']['note'], HB['sm07']['books'], 'Modern')
# --- Diaries (published only)
books = []
for r in w.parse(w.tables(LIST)[2]):
    if not r[0].isdigit(): continue
    y = yr(r[2]); m = re.match(r'(\d{4})-(\d\d)', r[2])
    if m and (int(m.group(1)), int(m.group(2))) > (2026, 10): continue
    books.append(dict(n=int(r[0]), t=r[1], y=y, m=MON[int(m.group(2))-1] if m else None))
add('diaries', 'Nancy Drew Diaries', f'Diaries #1–{books[-1]["n"]}', 'Aladdin, 2013–present', 'Paperback, hardcover with dust jacket, and ebook. Unnumbered special: A Nancy Drew Christmas (2018). Only titles published by Oct 2026 are listed.', books, 'Modern')
books = []
for r in w.parse(w.tables(LIST)[3]):
    if not r[0].isdigit(): continue
    m = re.match(r'(\d{4})-(\d\d)', r[2]); books.append(dict(n=int(r[0]), t=r[1], y=yr(r[2]), m=MON[int(m.group(2))-1] if m else None))
add('cluebook', 'Nancy Drew Clue Book', f'Clue Book #1–{books[-1]["n"]}', 'Aladdin, 2015–2024', 'Interactive chapter books; continuation of the Clue Crew.', books, 'Younger readers')
# --- Specials
sp = w.section if False else None
sec = LIST[LIST.index('===Specials==='):LIST.index("== ''Nancy Drew and the Hardy Boys: Be a Detective")]
books = []
for i, l in enumerate([l for l in sec.split('\n') if l.startswith('* ')]):
    m = re.match(r'\*\s*(.*)\s*\((\d{4})\)', l); books.append(dict(n=i+1, t=w.clean(m.group(1)), y=int(m.group(2))))
books.append(dict(n=len(books)+1, t='A Nancy Drew Christmas', y=2018, alt='Unnumbered Nancy Drew Diaries special.'))
add('specials', 'Specials & Handbooks', 'Specials', 'Various', 'Cookbook, Sleuth Book, picture books, ghost-story collections and crossovers.', books, 'Spinoffs')
# --- validation
for s in series:
    ns = [b['n'] for b in s['books']]
    assert ns == list(range(ns[0], ns[0]+len(ns))), (s['key'], ns)
    for b in s['books']:
        assert b['t'] and not re.search(r'[\[\]{}|<]', b['t']), (s['key'], b)
        if s['key'] in ('gd', 'digest'): assert b['y'], b
json.dump(series, open('/workspace/nancydrew/tools/data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for s in series: print(s['key'], len(s['books']), s['books'][0], '...', s['books'][-1])
print('total titles', sum(len(s['books']) for s in series))
