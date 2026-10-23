import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bridge', Path(__file__).with_name('server.py'))
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class Cell:
    def __init__(self, value=None, kind='s'):
        self.value, self.data_type, self.number_format = value, kind, 'General'

class Sheet:
    def __init__(self, fields):
        self.fields = fields
    def __getitem__(self, key):
        return self.fields.get(key, Cell())
    def cell(self, row, col):
        return self[f'{bridge.openpyxl.utils.get_column_letter(col)}{row}']

class Book:
    def __init__(self, sheet):
        self.sheet, self.closed = sheet, False
    def __getitem__(self, name):
        return self.sheet
    def close(self):
        self.closed = True

class ReaderTests(unittest.TestCase):
    def fixture(self, extra=None):
        temp = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        (root / '4. Refrence').mkdir()
        source = root / '4. Refrence/SIMPLY JUUN.xlsx'
        source.write_bytes(b'SYNTHETIC PAYLOAD ONLY')
        folder = root / '3.Knowledge/reports/workbook_reference_2026_10_18'
        folder.mkdir(parents=True)
        (folder / 'structure_profile.json').write_text(json.dumps([{'file':'SIMPLY JUUN.xlsx','sheets':[{'sheet':'Dummy','tables':[{'header_row':29,'end_row':31}, {'heading':'ENGAGEMENT','header_row':52,'end_row':55}]}]}]))
        values = {'Q29':Cell('NAMA'), 'R29':Cell('LINK INSTAGRAM'), 'T29':Cell('FOLLOWERS'), 'AA29':Cell('STATUS PAYMENT'), 'Q30':Cell('Dummy Person'), 'R30':Cell('https://example.test/dummy'), 'T30':Cell('Category raw'), 'AA30':Cell('Diajukan'), 'Q52':Cell('NAMA'), 'AB52':Cell('ER'), 'Q53':Cell('Dummy Person'), 'AB53':Cell('#DIV/0!','e')}
        values.update(extra or {})
        formula = dict(values, AB53=Cell('=SUM(V53:Z53)/AA53*100','f'))
        books = [Book(Sheet(formula)), Book(Sheet(values))]
        return root, source, books, [{'id':'ref-1','sourceFile':'SIMPLY JUUN.xlsx','sheet':'Dummy','sourceRow':30}]

    def test_raw_values_links_categories_and_cached_formula_are_retained(self):
        root, source, books, selection = self.fixture()
        before = source.read_bytes()
        with patch.object(bridge.openpyxl, 'load_workbook', side_effect=books):
            result = bridge.read_accounts(root, selection)
        account = result['accounts'][0]
        self.assertEqual(account['name'], 'Dummy Person')
        fields = {f['cell']:f for section in account['sections'] for f in section['fields']}
        self.assertEqual(fields['T30']['value'], 'Category raw')
        self.assertEqual(fields['R30']['value'], 'https://example.test/dummy')
        self.assertEqual(fields['AA30']['value'], 'Diajukan')
        self.assertEqual(fields['AB53']['value'], '#DIV/0!')
        self.assertEqual(fields['AB53']['formula'], '=SUM(V53:Z53)/AA53*100')
        self.assertEqual(source.read_bytes(), before)
        self.assertTrue(all(book.closed for book in books))

    def test_blank_and_zero_remain_distinct(self):
        root, _, books, selection = self.fixture({'T30':Cell(0,'n'), 'AA30':Cell(None)})
        with patch.object(bridge.openpyxl, 'load_workbook', side_effect=books):
            fields = bridge.read_accounts(root, selection)['accounts'][0]['sections'][0]['fields']
        self.assertEqual(next(f for f in fields if f['cell']=='T30')['value'], 0)
        self.assertIsNone(next(f for f in fields if f['cell']=='AA30')['value'])

    def test_duplicate_name_is_not_automatically_merged(self):
        root, _, books, selection = self.fixture({'Q54':Cell('Dummy Person')})
        with patch.object(bridge.openpyxl, 'load_workbook', side_effect=books):
            sections = bridge.read_accounts(root, selection)['accounts'][0]['sections']
        self.assertIn('lebih dari satu', sections[1]['note'])
        self.assertEqual(sections[1]['fields'], [])

    def test_path_selection_cannot_request_arbitrary_workbook(self):
        root, _, _, selection = self.fixture()
        selection[0]['sourceFile'] = '../secret.xlsx'
        with self.assertRaises(ValueError):
            bridge.read_accounts(root, selection)

if __name__ == '__main__':
    unittest.main()
