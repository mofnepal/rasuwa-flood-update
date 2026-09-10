import openpyxl, json
wb = openpyxl.load_workbook('/mnt/user-data/uploads/bhadra_19.xlsx', data_only=True)
rows = [r for r in wb['List'].iter_rows(min_row=2, values_only=True) if r[0] is not None]
bs2ad = {'भदौ ११':'2026-08-27','भदौ १२':'2026-08-28','भदौ १४':'2026-08-30','भदौ १५':'2026-08-31','भदौ १६':'2026-09-01','भदौ १७':'2026-09-02','भदौ १८':'2026-09-03','भदौ १९':'2026-09-04'}

import re
SECT = [
 ('embassy', [r'\bembassy\b']),
 ('gov', [r'insurance authority', r'tea development', r'nepse', r'karmachari sanchaya', r'citizen investment', r'rastriya banijya', r'nepal bank limited', r'agricultural development bank', r'nifra', r'salt trading', r'nagarik stock']),
 ('insurance', [r'insurance', r'beema', r'reinsurance']),
 ('bank', [r'\bbank\b', r'laghubitta', r'bittiya', r'finance', r'securities', r'stock dealer', r'hire purchase', r'khalti', r'co-?operative', r'investment', r'hathway', r'financial services', r'ime limited', r'ime co', r'eshare']),
 ('energy', [r'hydropower', r'power company', r'electric\b', r'\bpower\b']),
 ('health', [r'medical', r'path lab', r'hos\\. &', r'hospital', r'\beye\b', r'health', r'healing', r'hygiene', r'medicine', r'cataract', r'pharma', r'vigen']),
 ('education', [r'institute', r'studies', r'\\bait\\b', r'school', r'education', r'consultancy', r'\becan\b', r'publication', r'books', r'learning', r'academ', r'college', r'kiec']),
 ('media', [r'films', r'production', r'media', r'television', r'\bfm\b']),
 ('association', [r'art of living', r'shanti kendra', r'samsad', r'manch', r'isha nepal', r'masjid', r'monast', r'democracy', r'wellness', r'cliff', r'association', r'federation', r'\bfed\.', r'\bclub\b', r'samaj', r'sangh', r'foundation', r'trust', r'guthi', r'satsang', r'tapoban', r'takiya', r'surveyors', r'auditors', r'\bnada\b', r'nafea', r'chamber', r'yoga', r'pariwar', r'social service', r'ahmadiyya', r'gurudham', r'jaya janata', r'ananda', r'pranic', r'osho', r'kalyankari', r'world wildlife', r'lions', r'cataract project', r'\bsamiti\b', r'seva', r'welfare', r'\bnepal\s+\w+\s+association']),
 ('tech', [r'technolog', r'ncell', r'info developers', r'software', r'data vault', r'\btech\b', r'solutions', r'\beon\b', r'neoteric', r'flextecs', r'digital', r'insights', r'stream peak', r'bizcare', r'rigo', r'midas', r'smart choice', r'swift']),
 ('hospitality', [r'sekuwa', r'restaurant', r'hotel', r'trekking', r'expedition', r'cablecar', r'cable car', r'hills limited', r'darshan', r'travels', r'soaltee', r'dwarika', r'resort', r'tourism', r'airlines']),
 ('industry', [r'surya nepal', r'mottrox', r'vanaspati', r'processing', r'c\\.g\\. square', r'rolling mills', r'oils', r'packaging', r'milk', r'distilleries', r'polymers', r'berger', r'jensen', r'cement', r'steel', r'ispat', r'distillery', r'brewery', r'beverage', r'foods', r'\bfeed', r'sugar', r'paints', r'plywood', r'spinning', r'wires', r'rotomould', r'plast', r'minerals', r'\boil\b', r'udyog', r'udhyog', r'industr', r'liquors', r'brewing', r'herbs', r'\btea\b', r'synpack', r'khadya', r'manufactur', r'bullion', r'agro', r'breeder', r'spices', r'metal', r'pellet', r'body works', r'engineering', r'chemical', r'patanjali', r'ayurved', r'gorkha lahari', r'jagdamba']),
 ('trade', [r'automobiles', r'clearing', r'forwarding', r'forewarding', r'logistics', r'lube', r'builders', r'contractor', r'events', r'holding', r'company pvt', r'trading', r'motors', r'automotive', r'\bauto\b', r'rides', r'enterprises', r'distributors', r'emporium', r'supply', r'syakar', r'sipradi', r'cimex', r'holdings', r'\bgroup\b', r'mart', r'service center', r'suzuki', r'\bstc\b', r'international', r'glocal', r'silver lining', r'broker']),
]
def sector(name, typ):
    if typ == 'ind': return 'individual'
    n = name.lower()
    for code, pats in SECT:
        if any(re.search(p, n) for p in pats): return code
    return 'other'

contrib = [dict(sn=r[0], bs=r[1], ad=bs2ad.get(r[1],''), name=r[2], type='ins' if r[3]=='Institutional' else 'ind',
                mode='chq' if r[4]=='Cheque' else 'bt', npr=float(r[5] or 0), usd=float(r[6] or 0), sector=sector(r[2], 'ind' if r[3]!='Institutional' else 'ins')) for r in rows]
dec = json.load(open('/home/claude/starter/seed/decisions.json', encoding='utf-8'))
resc = json.load(open('/home/claude/starter/seed/rescue_snapshot.json', encoding='utf-8'))
data = {
 "meta": {"portal_ne":"रसुवा–भोटेकोशी बाढी अपडेट","portal_en":"MoF Rasuwa–Bhotekoshi Flood Update","updated_at":"2026-09-07T17:00:00+05:45","updated_bs":"२०८३ भदौ २२ गते, १७:०० बजे","updated_en":"7 Sep 2026, 5:00 PM NPT","fx_usd_npr":150.88,"fx_source_ne":"प्रधानमन्त्री दैवी प्रकोप उद्धार कोषको कोष स्थिति विवरणमा प्रयुक्त दर","fx_source_en":"Rate used in the Prime Minister Disaster Relief Fund status statement","event_date_bs":"२०८३ भदौ १०","event_date_en":"26 August 2026"},
 "nchl": {"as_of_en":"7 Sep 2026, 5:00 PM","as_of_bs":"२०८३ भदौ २२, १७:०० बजे","total":4448586974.34,"count":252326,
   "channels":[["IPS / चेक ट्रान्सफर","IPS / Cheque Transfer",1225,1698907769.22],["कार्ड – अन्तर्राष्ट्रिय","Card – International",96899,1490069985.09],["अनलाइन ट्रान्सफर","Online Transfer",12350,566745855.89],["घरेलु QR","Domestic QR",114334,401954542.26],["रेमिट्यान्स","Remittance",26417,282370964.54],["अन्तर्राष्ट्रिय QR","International QR",666,5388549.57],["कार्ड – घरेलु","Card – Domestic",435,3149307.77]],
   "history":[["2026-09-05","भदौ २०",246614,4263565174.85],["2026-09-07","भदौ २२",252326,4448586974.34]]},
 "fonepay": {"as_of_en":"till 6 Sep 2026","as_of_bs":"२०८३ भदौ २१ सम्म","total":2375275198,"count":902446,
   "channels":[["घरेलु QR","Domestic QR",822946,2137872218],["फोनपे बिल्स","Fonepay Bills",50332,148435944],["NPCI (भारत)","NPCI (India)",22324,51617127],["Alipay","Alipay",3469,19025058],["IBFT","IBFT",3375,18324851]],
   "daily":[["2026-09-05","भदौ २०",7458,35166232],["2026-09-06","भदौ २१",6156,29875905]],
   "history":[["2026-09-05","भदौ २०",896354,2345613954],["2026-09-06","भदौ २१",902446,2375275198]]},
 "contributions": [c for c in contrib if c["npr"] > 0],
 "handover_usd": [c for c in contrib if c["usd"] > 0],
 "categories": [
   {"code":"A","ne":"अनलाइन / बैंकिङ च्यानल (रु.)","en":"Online / banking channels (NPR)","desc_ne":"donate.gov.np मार्फत NCHL र Fonepay नेटवर्कबाट कोषका बैंक खातामा जम्मा भएको रकम। कोष स्थिति विवरण (नेपाल राष्ट्र बैंक) को बैंक-अनुसार विवरण यसै रकमको खाता स्थिति हो — थप गरिँदैन।","desc_en":"Amounts settled into the Fund's bank accounts via the NCHL and Fonepay networks through donate.gov.np. The bank-wise fund status statement (Nepal Rastra Bank) is the account view of this same money and is not added on top."},
   {"code":"B","ne":"चेक / हस्तान्तरण — मा. अर्थमन्त्री समक्ष (रु.)","en":"Cheque / handover to the Hon. Finance Minister (NPR)","desc_ne":"संस्था तथा व्यक्तिले मा. अर्थमन्त्री समक्ष हस्तान्तरण गरेका चेक र बैंक ट्रान्सफर — नामसहितको छुट्टै डाटाबेस।","desc_en":"Cheques and bank transfers handed over to the Hon. Finance Minister by institutions and individuals — a separate, name-wise database."},
   {"code":"C","ne":"वैदेशिक सहयोग — विदेशी मुद्रा जम्मा (USD)","en":"Foreign assistance — foreign-currency deposits (USD)","desc_ne":"कोषका USD खाता (हिमालयन बैंक, लक्ष्मी सनराइज बैंक) मा बाढीपछि जम्मा भएको कुल विदेशी मुद्रा — प्रधानमन्त्री दैवी प्रकोप उद्धार कोषको कोष स्थिति विवरण (नेपाल राष्ट्र बैंक) अनुसार। यही रकम वैदेशिक सहयोगको कुल हो; नामसहित पहिचान भएका दाता यसैको उपसमूह हुन्।","desc_en":"Total foreign currency deposited after the flood in the Fund's USD accounts (Himalayan Bank, Laxmi Sunrise Bank) per the Prime Minister Disaster Relief Fund status statement (Nepal Rastra Bank). This is the foreign-assistance total; named contributors are a subset of it."},
   {"code":"D","ne":"वैदेशिक सहयोग — नामसहित पहिचान (USD)","en":"Foreign assistance — identified contributors (USD)","desc_ne":"विदेशी सरकार, दूतावास, कम्पनी तथा दातृ निकायबाट प्राप्त, नाम र मितिसहित प्रमाणित सहयोग (हस्तान्तरण गरिएका USD चेक समेत) — वर्ग ग भित्रै समावेश, थप गरिँदैन।","desc_en":"Verified, named contributions from foreign governments, embassies, corporations and donors, including USD cheques handed over to the Hon. Finance Minister — already inside C, not added again."}],
 "fund_status": {
   "source_ne":"प्रधानमन्त्री दैवी प्रकोप उद्धार कोष — दैनिक जम्मा तथा कोष स्थिति विवरण (नेपाल राष्ट्र बैंक)","source_en":"Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status statement (Nepal Rastra Bank)",
   "as_of_bs":"२०८३ भदौ २२, बिहान ९:०० बजे","as_of_en":"7 Sep 2026, 9:00 AM","fx":150.88,
   "dates_bs":["भदौ ११","भदौ १२","भदौ १३","भदौ १४","भदौ १५","भदौ १६","भदौ १७","भदौ १८","भदौ १९","भदौ २०","भदौ २१","भदौ २२"],
   "dates_ad":["2026-08-27","2026-08-28","2026-08-29","2026-08-30","2026-08-31","2026-09-01","2026-09-02","2026-09-03","2026-09-04","2026-09-05","2026-09-06","2026-09-07"],
   "npr":{"before":2082422405,"balance":8184247986,"gross":7101825581,"usage":1000000000,"usage_note_ne":"रु. १ अर्ब राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरणलाई हस्तान्तरण (२०८३/०५/१६)","usage_note_en":"NPR 1 billion transferred to the National Disaster Risk Reduction and Management Authority (2083/05/16)",
     "balance_series":[3245262844,4505799773,5188051596,5246944585,5879223842,5366551227,6287875751,7446729840,8020391275,8099352131,8158675388,8184247986],
     "gross_series":[1162840439,2423377368,3105629191,3164522180,3796801437,4284128822,5205453346,6364307435,6937968870,7016929726,7076252983,7101825581],
     "daily_series":[1162840439,1260536929,682251823,58892989,632279257,487327385,921324524,1158854089,573661435,78960856,59323257,25572598],
     "banks":[["Nepal Bank Limited",0,250436466],["Agriculture Development Bank Limited",0,238656173],["Everest Bank Limited",1304154109,2225223451],["Standard Chartered Bank Nepal Limited",297025693,358676234],["Himalayan Bank Limited",130628680,473588156],["Laxmi Sunrise Bank Limited",29192858,213595768],["Rastriya Banijya Bank Limited",1201664412,3216038940],["Nabil Bank Limited",69190332,635063913],["Global IME Bank Limited",78540000,572968884]]},
   "usd":{"before":586048,"balance":20684171,"gross":20098123,"equiv_npr":3120827782,
     "balance_series":[586048,680618,1948693,2143232,3193238,6114148,7158247,8115790,19829743,20336879,20339668,20684171],
     "gross_series":[0,94570,1362645,1557184,2607190,5528100,6572199,7529742,19243695,19750831,19753620,20098123],
     "daily_series":[0,94570,1268075,194539,1050006,2920910,1044099,957543,11713952,507137,2788,344504],
     "banks":[["Himalayan Bank Limited",586048,11969988],["Laxmi Sunrise Bank Limited",0,8714183]]},
   "total_available_npr":11305075768},
 "sectors": [["individual","व्यक्तिगत","Individuals"],["bank","बैंक तथा वित्तीय संस्था","Banks & financial institutions"],["insurance","बीमा","Insurance"],["industry","उद्योग तथा उत्पादन","Industry & manufacturing"],["trade","व्यापार, अटो तथा सेवा","Trade, auto & services"],["hospitality","होटल तथा पर्यटन","Hotels & tourism"],["tech","सूचना प्रविधि तथा दूरसञ्चार","IT & telecom"],["health","स्वास्थ्य","Health"],["education","शिक्षा","Education"],["media","सञ्चार तथा चलचित्र","Media & film"],["energy","ऊर्जा / जलविद्युत","Energy / hydropower"],["association","संघ, संस्था तथा सामाजिक","Associations, trusts & social"],["gov","सरकारी / नियामक निकाय","Government & regulators"],["embassy","दूतावास","Embassies"],["other","अन्य कम्पनी","Other companies"]],
 "foreign": [
   {"ad":"2026-09-01","bs":"२०८३ भदौ १६","name":"NVIDIA Corporation","country_ne":"संयुक्त राज्य अमेरिका","country_en":"USA","type":"corp","kind":"cash","channel_ne":"प्रधानमन्त्री दैवी प्रकोप उद्धार कोष (बैंक जम्मा)","channel_en":"PM Disaster Relief Fund (bank deposit)","usd":10000000,"npr":1508800000,"purpose_ne":"रसुवा बाढी राहत तथा पुनर्निर्माण","purpose_en":"Rasuwa flood relief & reconstruction","featured":True},
   {"ad":"2026-08-30","bs":"२०८३ भदौ १४","name":"Embassy of the People's Republic of China","country_ne":"चीन","country_en":"China","type":"gov","kind":"cash_chq","channel_ne":"मा. अर्थमन्त्री समक्ष हस्तान्तरण (USD चेक)","channel_en":"Handover to Hon. Finance Minister (USD cheque)","usd":200000,"npr":30176000,"purpose_ne":"रसुवा बाढी राहत","purpose_en":"Rasuwa flood relief","featured":False}],
 "rescue": resc,
 "initiatives": dec["decisions"],
 "contacts": dec["contacts"],
 "ministry": dec["ministry"],
 "portals": dec["external_portals"],
 "contact_intro_ne": "रसुवा बाढी प्रभावितहरूका लागि प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा नगद राहत तथा जिन्सी सहयोग गर्न चाहने परोपकारी व्यक्ति, निजी क्षेत्र, दातृ निकाय तथा अन्तर्राष्ट्रिय संघ–संस्थाहरूका लागि राहत संकलनको एकद्वार प्रणाली अर्थ मन्त्रालय मार्फत सञ्चालन गरिएको छ। तसर्थ, सहयोग गर्न चाहने सबै व्यक्ति तथा निकायहरूलाई देहायका सम्पर्क व्यक्तिहरूसँग समन्वय गरी सहयोग उपलब्ध गराउन हार्दिक अनुरोध गरिन्छ।",
 "contact_intro_en": "The Ministry of Finance operates a single-window system for the collection of relief for those affected by the Rasuwa flood, serving philanthropic individuals, the private sector, donor agencies and international organisations wishing to contribute cash relief or in-kind support to the Prime Minister Disaster Relief Fund. All individuals and organisations wishing to contribute are kindly requested to coordinate with the contact persons listed below.",
 "updates": [
   ["2026-09-07","भदौ २२","NCHL च्यानलबाट रु. ४.४५ अर्ब — २,५२,३२६ कारोबार (१७:०० बजे)","NPR 4.45 billion via NCHL channels — 252,326 transactions (5:00 PM)","contributions.html"],
   ["2026-09-07","भदौ २२","प्रधानमन्त्री दैवी प्रकोप उद्धार कोष स्थिति: खातामा जम्मा रु. ७.१० अर्ब + USD २ करोड १ लाख · उपलब्ध मौज्दात रु. ११.३१ अर्ब","Prime Minister Disaster Relief Fund status: NPR 7.10 billion + USD 20.10 million collected · available balance NPR 11.31 billion","contributions.html#nrb"],
   ["2026-09-06","भदौ २१","Fonepay च्यानलबाट रु. २.३८ अर्ब — ९,०२,४४६ कारोबार","NPR 2.38 billion via Fonepay channels — 902,446 transactions","contributions.html"],
   ["2026-09-06","भदौ २१","NDRRMA दैनिक प्रतिवेदन — उद्धार १३,३९१ · मृतक १,३४२ · बेपत्ता लगभग ४,९९६","NDRRMA daily report — rescued 13,391 · casualties 1,342 · missing ~4,996","rescue.html"],
   ["2026-09-04","भदौ १९","मा. अर्थमन्त्री समक्ष ३३१ हस्तान्तरण — रु. १.९३ अर्ब","331 handovers to the Hon. Finance Minister — NPR 1.93 billion","contributions.html"],
   ["2026-09-03","भदौ १८","मन्त्रिपरिषद् निर्णय: Business Recovery Plan पहिलो चरण — १८ राहत व्यवस्था","Cabinet decision: Business Recovery Plan Phase 1 — 18 relief measures","initiatives.html"],
   ["2026-09-01","भदौ १६","NVIDIA Corporation — USD १ करोड राहत तथा पुनर्निर्माणका लागि","NVIDIA Corporation — USD 10 million for relief and reconstruction","foreign.html"],
   ["2026-08-27","भदौ ११","राहत संकलन एकद्वार प्रणाली अर्थ मन्त्रालय मार्फत सञ्चालनमा","Single-window relief collection system operating through the Ministry of Finance","initiatives.html"]]
}
for c in data["contacts"]:
    if c["name_en"] == "Niraj Bhusal":
        c["title_ne"] = "आइटी"; c["title_en"] = "IT"; c["group_ne"] = "निजी क्षेत्र तथा सहयोगी व्यक्तिहरू (मा. अर्थमन्त्रीज्यूको सचिवालय)"; c["group_en"] = "Private sector & individual contributors (Hon. Finance Minister's Secretariat)"
open('/home/claude/web/data/data.js','w',encoding='utf-8').write('window.RFU_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('contrib', len(contrib), 'bytes', len(json.dumps(data, ensure_ascii=False)))
