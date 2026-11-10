"""Export an explicit editable source without saving/overwriting that source."""
import bpy,sys,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:]
source=Path(args[0]).resolve()
destination=Path(args[1]).resolve()
assert source.is_file() and source.suffix=='.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects['Fin_Rig']
parts=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)]
for target in [rig]+[o.data.shape_keys for o in parts if o.data.shape_keys]:
 if target.animation_data:
  target.animation_data.action=None
  for track in target.animation_data.nla_tracks:track.mute=False
for b in rig.pose.bones:b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
# Join only non-morph surfaces in this disposable export scene. Editable source stays separated.
static=[o for o in parts if not o.data.shape_keys]
bpy.ops.object.select_all(action='DESELECT')
for o in static:o.select_set(True)
bpy.context.view_layer.objects.active=static[0]
bpy.ops.object.join()
bpy.context.object.name='Fin_weighted_surfaces'
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in bpy.context.scene.objects:
 if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers):o.select_set(True)
destination.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_skins=True,export_morph=True)
raw=destination.read_bytes();length=int.from_bytes(raw[12:16],'little');g=json.loads(raw[20:20+length])
report={'source':str(source.relative_to(ROOT)),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'glbSHA256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'meshes':len(g.get('meshes',[])),'primitives':sum(len(m['primitives']) for m in g.get('meshes',[])),'triangles':sum(g['accessors'][p['indices']]['count']//3 for m in g.get('meshes',[]) for p in m['primitives']),'joints':len(g.get('skins',[{}])[0].get('joints',[])),'animations':[{'name':a['name'],'channels':len(a['channels']),'morphChannels':sum(c['target']['path']=='weights' for c in a['channels'])} for a in g.get('animations',[])],'status':'procedural art candidate, awaiting human review'}
(source.parent/'export-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
