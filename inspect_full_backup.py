import json

with open(r'C:\Users\Dodos\Downloads\family_tree_backup.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('Version:', data.get('version'))
print('ActiveRootId:', data.get('activeRootId'))
people = data.get('people', [])
print(f'Total People: {len(people)}')
for i, p in enumerate(people):
    demo = p.get('isDemo')
    name = p.get('fullName')
    pid = p.get('id')
    print(f"{i+1:2d}. {name:30s} (id: {pid}, isDemo: {demo})")
print(f"ParentChild relations: {len(data.get('parentChild', []))}")
print(f"Spouses relations: {len(data.get('spouses', []))}")
print(f"Aggregates: {len(data.get('aggregates', []))}")
