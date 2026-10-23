"""Authorized local export for client demonstration; original Excel stays read-only."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / '5.Client-Demo/Melin-Cineva'
spec = importlib.util.spec_from_file_location('reader', ROOT / '3.Knowledge/scripts/live_reference_2026_10_18/server.py')
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)

def build():
    selected = json.loads((ROOT / '3.Knowledge/reports/account_reference_2026_10_18/selection.json').read_text())['selection'][0]
    account = reader.read_accounts(selections=[selected])['accounts'][0]
    fields = {field['cell']:field['value'] for section in account['sections'] for field in section['fields']}
    if account['name'].casefold() != 'melin riswana putri':
        raise ValueError('Selected source row no longer identifies the requested person; review before export.')
    text = lambda cell: str(fields.get(cell) or '')
    notes = [
        'Periode ringkasan S17 (Mei–Juni) berbeda dari timeline detail S24:T24 (Agustus–September). Keduanya dipertahankan untuk review.',
        'Tanggal Payment Serentak T24 tertulis 8 Agustus 2026, sebelum produksi/posting. Ditandai perlu review, tidak dikoreksi otomatis.',
        'Tanggal Posting T24 tidak memiliki pemisah range yang jelas. Belum dimasukkan sebagai tanggal pasti; edit manual setelah konfirmasi.',
        'Tidak ada jadwal visit atau jam kunjungan spesifik pada sumber. Kalender berisi milestone all-day; visit baru dapat ditambahkan sebagai simulasi.',
        'Fee Rp100.000 memakai brief per creator S19/S21, bukan nominal kontrak personal terverifikasi. Benefit Rp300.000 mengikuti S21; harga retail Glee Rp213.000 dari T16 tetap terpisah.',
        'Diajukan pada AA36 bukan bukti kas diterima. paidAmount asli null; payments kosong sampai demo mencatat simulasi.',
        'Link draft/review/post tersedia di Excel, tetapi QC approved dan tanggal publikasi aktual tidak dibuktikan oleh ketersediaan link.',
        'Kategori niche campaign bukan niche pribadi Melin yang sudah terverifikasi. Profil niche pribadi dibiarkan kosong.',
    ]
    dates = [('Listing', '2026-08-08', None, False), ('Info Lolos', '2026-08-10', None, False), ('CO / pengiriman product', '2026-08-10', None, False), ('Drafting', '2026-08-15', '2026-09-01', False), ('Posting', None, None, True), ('Insight H+7', '2026-08-27', '2026-09-02', False), ('Payment Serentak', '2026-08-08', None, True)]
    raw_dates = [line.strip() for line in text('T24').splitlines() if line.strip()]
    if len(raw_dates) != len(dates):
        raise ValueError('Milestone row count changed; review mapping.')
    events = [{'id':f'event-{i+1}', 'title':title, 'kind':'milestone', 'startDate':start, 'endDate':end, 'allDay':True, 'rawDate':raw_dates[i], 'sourceCell':f'S24:T24 line {i+1}', 'requiresReview':review, 'note': 'Perlu konfirmasi tanggal sumber.' if review else 'Mapping tanggal detail Excel; jam tidak disebutkan.'} for i,(title,start,end,review) in enumerate(dates)]
    data = {
        'version':1, 'datasetId':'cineva-melin-simply-juun-3-v1', 'editedAt':None,
        'user':{'id':'creator-1','name':account['name'],'instagram':text('R36'),'followers':fields.get('T36'),'niches':[],'phone':text('U36'),'address':text('V36')},
        'campaign':{'id':'campaign-simply-3','title':'Simply Juun · Campaign 3','brand':text('S5'),'brief':text('S6'),'objective':text('S10'),'audience':text('S11'),'messaging':text('S12'),'sow':text('S22'),'overviewPeriod':text('S17'),'feeAmount':100000,'barterValue':300000,'productRetailValue':213000,'paymentStatus':text('AA36'),'paidAmount':None,'selectedProduct':text('W36')},
        'insights':dict(zip(['likes','comments','shares','saves','reposts','views'], [fields.get(f'{c}61') for c in ['V','W','X','Y','Z','AA']]), sourceCategory=text('AC61')),
        'deliverables':[{'id':f'output-{i+1}','title':title,'platform':platform,'sourceUrl':text(cell),'status':'Referensi tersedia' if text(cell) else 'Belum tercatat'} for i,(title,platform,cell) in enumerate([('Review Shopee','Shopee','X36'),('Draft / drive','Brand asset','Y36'),('Reels owning','Instagram','U61')])],
        'events':events,'payments':[],
        'source':{'file':account['sourceFile'],'sheet':account['sheet'],'rosterRow':36,'insightRow':61,'sha256':account['sha256']},
        'notes':notes,'rawSource':account['sections'],
        'collections':{
            'workspaces':[{'id':'hq-1','name':'Cineva HQ','product':'hq'},{'id':'creator-1','name':account['name'],'product':'creator'}],
            'brands':[{'id':'brand-simply','name':text('S5'),'contact':text('S7')}],
            'batches':[{'id':'batch-3','campaignId':'campaign-simply-3','name':'Campaign 3 · cohort sumber'}],
            'tickets':[{'id':'ticket-melin-3','module':'hots:cineva','status':'wait_pay','fields':[{'cstm_col':'campaign_id','lbl_col':'Campaign','value':'campaign-simply-3'},{'cstm_col':'fee_amount','lbl_col':'Fee brief creator','value':100000},{'cstm_col':'paid_amount','lbl_col':'Kas diterima terverifikasi','value':None},{'cstm_col':'payment_status','lbl_col':'Status payment sumber','value':text('AA36')}]}],
            'assignments':[{'id':'assignment-melin-3','ticketId':'ticket-melin-3','campaignId':'campaign-simply-3','batchId':'batch-3','userId':'creator-1'}],
        },
    }
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT / 'cineva-melin-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Authorized Melin document dataset exported locally; source Excel unchanged.')

if __name__ == '__main__':
    build()
