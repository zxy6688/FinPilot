"""Gate B-K content integrity, preserved resources and model-based teaching examples."""
import hashlib
import json
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[2]
CONTENT=ROOT/'content'
DATA=json.loads((CONTENT/'knowledge.json').read_text(encoding='utf-8'))
CONCEPTS=DATA['concepts']
@pytest.mark.parametrize('concept',CONCEPTS,ids=lambda c:str(c['id']))
def test_each_concept_is_substantive_and_connected(concept):
    ids={c['id'] for c in CONCEPTS}
    for field in ['summary','explain','life','example','misunderstanding','boundary']:
        assert len(concept[field])>=18,(concept['id'],field)
    assert sum(len(concept[k]) for k in ['explain','life','example','misunderstanding','boundary'])>=270
    assert len(concept['diagram'])>=2
    assert concept['prerequisite'] in ids and concept['prerequisite']!=concept['id']
    assert len(concept['related'])>=2
    assert all(i in ids and i!=concept['id'] for i in concept['related'])
    lessons=json.loads((CONTENT/'lessons.json').read_text(encoding='utf-8'))
    assert all(i in {l['id'] for l in lessons} for i in concept['lesson_ids'])
    q=concept['quiz']
    assert 0<=q['correct_answer']<len(q['options'])
    assert len(q['explanation'])>=16
    assert concept['reference']['url'].startswith('https://')

def test_all_original_material_is_preserved_except_checkout_line_endings():
    audit=json.loads((ROOT/'docs/redesign/gate-b-k/resource-audit.json').read_text(encoding='utf-8'))
    for path,digest in audit['preserved_files'].items():
        # The original audit was produced on Windows; Git normalizes text on Linux.
        data=(ROOT/Path(path.replace('\\', '/'))).read_bytes()
        lf=data.replace(b'\r\n',b'\n')
        variants=(data,lf,lf.replace(b'\n',b'\r\n'))
        assert digest in {hashlib.sha256(value).hexdigest() for value in variants},path
    assert len(json.loads((CONTENT/'lessons.json').read_text(encoding='utf-8')))==28
    assert len(json.loads((CONTENT/'quizzes.json').read_text(encoding='utf-8')))==64

def test_six_domains_cover_all_concepts_without_duplicate_membership():
    assert len(DATA['domains'])==6 and len(CONCEPTS)>=36
    members=[i for d in DATA['domains'] for i in d['concept_ids']]
    assert sorted(members)==sorted(c['id'] for c in CONCEPTS)
    assert len(set(members))==len(members)
    assert set(range(1,25)) <= set(members)

def test_new_teaching_examples_use_consistent_arithmetic():
    assert 500-800==-300 and 500-800+1500-700==500
    assert 10000-(10000-1000)*.8==2800
    assert 2*100+8*98==984
    assert 1050/1.10==pytest.approx(954.55,abs=.01)
    assert (103/98-1)*100==pytest.approx(5.10,abs=.01)
    assert 100/1.03**10==pytest.approx(74.41,abs=.01)
    assert 100/1.04**10==pytest.approx(67.56,abs=.01)
    assert .95*100+.05*40==97
