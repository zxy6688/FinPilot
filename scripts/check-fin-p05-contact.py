import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];bpy.ops.wm.open_mainfile(filepath=str(root/'assets/fin-3d-p05/candidate-01/fin-p05-source.blend'))
rig=bpy.data.objects['Fin_Rig'];feet=[o for o in bpy.data.objects if o.type=='MESH' and 'sole' in o.name.lower()];results=[]
for name in ['Idle','Walk','Jump','Sit','LieDown','Sleep','Wake']:
 action=bpy.data.actions[name];rig.animation_data.action=action
 minimum=100;maximum=-100;samples=[]
 for frame in range(int(action.frame_range[0]),int(action.frame_range[1])+1,3):
  bpy.context.scene.frame_set(frame);deps=bpy.context.evaluated_depsgraph_get();positions=[]
  for o in feet:
   evaluated=o.evaluated_get(deps);m=evaluated.to_mesh();z=min((evaluated.matrix_world@v.co).z for v in m.vertices);evaluated.to_mesh_clear();positions.append(z);minimum=min(minimum,z);maximum=max(maximum,z)
  samples.append({'frame':frame,'solesZ':positions})
 results.append({'action':name,'minimumSoleZ':minimum,'maximumSoleZ':maximum,'samples':samples})
(root/'docs/fin-pet-p05/contact-validation.json').write_text(json.dumps(results,indent=2))
print([(r['action'],r['minimumSoleZ'],r['maximumSoleZ']) for r in results])
