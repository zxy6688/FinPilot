import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/fin-3d-p05/candidate-01/fin-p05-source.blend'))
for o in list(bpy.context.scene.objects):
 if o.type=='ARMATURE' or (o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(root/'frontend/public/fin-3d/fin-p0.glb'))
for o in bpy.context.scene.objects:
 if o.animation_data:o.animation_data_clear()
 if o.type=='ARMATURE':
  for b in o.pose.bones:b.location=(0,0,0);b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
scene=bpy.context.scene;cam=scene.camera;out=root/'docs/fin-pet-p05/blender/old-matched';out.mkdir(parents=True,exist_ok=True)
for name,a in [('front',0),('three-quarter',math.pi/4),('side',math.pi/2),('back',math.pi)]:
 cam.location=(6*math.sin(a),-6*math.cos(a),1.4);cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.25
 scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
