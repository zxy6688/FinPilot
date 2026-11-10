"""Reproducible Blender authoring source. Run with Blender --background --python.
Custom sculpted profiles and closed leaf surfaces, skinned to an editable rig.
P0 art candidate, not a claim of final professional character-art approval.
"""
import bpy, bmesh, math, json
from mathutils import Vector
from pathlib import Path
from math import sin, cos, pi, sqrt

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/fin-3d'; OUT.mkdir(parents=True,exist_ok=True)
PUBLIC=ROOT/'frontend/public/fin-3d'; PUBLIC.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=30

def mat(name,color,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
cream=mat('Warm porcelain',(0.94,.90,.76),.64)
mint=mat('Mint jade',(.12,.55,.43),.52)
light=mat('Young leaf',(.40,.73,.42),.55)
dark=mat('Deep mint',(.025,.29,.25),.56)
vein=mat('Soft leaf veins',(.58,.77,.43),.6)
gold=mat('Amber compass',(.90,.50,.105),.34,.3)
ink=mat('Eye deep espresso',(.018,.027,.027),.19)
iris=mat('Amber iris',(.19,.105,.035),.29)
white=mat('Eye catchlight',(1,.98,.89),.17)
pink=mat('Soft cheek',(.92,.49,.34),.8)
mouthmat=mat('Mouth warm shadow',(.21,.075,.044),.65)

arm=bpy.data.armatures.new('Fin editable skeleton');rig=bpy.data.objects.new('Fin_Rig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
spec=[('Root',(0,0,0),None),('Body',(0,0,.55),'Root'),('Head',(0,0,1.52),'Body'),('Crown',(0,0,2.18),'Head'),('Wing.L',(.43,.12,1.1),'Body'),('Wing.R',(-.43,.12,1.1),'Body'),('Arm.L',(.39,-.04,.98),'Body'),('Arm.R',(-.39,-.04,.98),'Body'),('Foot.L',(.25,0,.22),'Root'),('Foot.R',(-.25,0,.22),'Root'),('Compass',(0,-.43,.87),'Body'),('Eye.L',(.27,-.665,1.78),'Head'),('Eye.R',(-.27,-.665,1.78),'Head'),('Gaze.L',(.27,-.70,1.78),'Eye.L'),('Gaze.R',(-.27,-.70,1.78),'Eye.R'),('Brow.L',(.27,-.61,2.05),'Head'),('Brow.R',(-.27,-.61,2.05),'Head'),('Mouth',(0,-.70,1.53),'Head')]
for name,pos,parent in spec:
 b=arm.edit_bones.new(name);b.head=pos;b.tail=Vector(pos)+Vector((0,.12,0))
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
meshes=[]
def mesh(name,verts,faces,material,bone,sub=0):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free();data.update()
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.data.materials.append(material)
 for p in data.polygons:p.use_smooth=True
 if sub:
  bpy.context.view_layer.objects.active=o;o.select_set(True);mod=o.modifiers.new('Editable surface refinement','SUBSURF');mod.levels=sub;bpy.ops.object.modifier_apply(modifier=mod.name);o.select_set(False)
 group=o.vertex_groups.new(name=bone);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
 mod=o.modifiers.new('Fin skin','ARMATURE');mod.object=rig;o.parent=rig;meshes.append(o)
 return o

def surface(name,center,scale,material,bone,shape=0,segments=40,rings=24):
 # Sculpted egg/pear surface; a rounded lower belly and slightly forward cheeks.
 v=[];f=[]
 for j in range(rings+1):
  phi=pi*j/rings;zz=cos(phi);rr=sin(phi);width=1+shape*(-zz*.27+.10*sin(phi*2))
  for i in range(segments):
   t=2*pi*i/segments
   x=scale[0]*rr*cos(t)*width;y=scale[1]*rr*sin(t);z=scale[2]*zz
   if shape:y-=.035*rr*rr*(1-zz)
   v.append((center[0]+x,center[1]+y,center[2]+z))
 for j in range(rings):
  for i in range(segments):
   a=j*segments+i;b=j*segments+(i+1)%segments;f.append((a,b,b+segments,a+segments))
 return mesh(name,v,f,material,bone)

def tube(name,points,radius,material,bone):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=12;curve.bevel_depth=radius;curve.bevel_resolution=3
 sp=curve.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
 o.data.materials.append(material);g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE');m=o.modifiers.new('Fin skin','ARMATURE');m.object=rig;o.parent=rig;meshes.append(o)
 return o

def leaf(name,start,end,width,material,bone,bulge=.10,depth=.08):
 # Closed, tapered leaf volume with a curved midrib; not a plane or stock primitive.
 start=Vector(start);end=Vector(end);axis=end-start;side=Vector((axis.z,0,-axis.x)).normalized()
 v=[];f=[];n=18;sides=12
 for j in range(n+1):
  t=j/n;w=width*sin(pi*t)**.85+.001;c=start+axis*t+Vector((0,-bulge*sin(pi*t),.04*sin(pi*t)))
  for i in range(sides):
   a=i*2*pi/sides;point=c+side*(w*cos(a))+Vector((0,depth*sin(pi*t)*sin(a),0));v.append(tuple(point))
 for j in range(n):
  for i in range(sides):a=j*sides+i;b=j*sides+(i+1)%sides;f.append((a,b,b+sides,a+sides))
 o=mesh(name,v,f,material,bone,1)
 pts=[tuple(start+axis*t+Vector((0,-(bulge+depth)*sin(pi*t)-.008,.04*sin(pi*t)))) for t in [.08,.3,.55,.8,.95]]
 tube(name+' midrib',pts,.007,vein,bone)
 return o

surface('Sculpted pear torso',(0,.01,.72),(.47,.38,.62),cream,'Body',.8)
surface('Jade head mantle',(0,0,1.73),(.72,.54,.65),mint,'Head',.30)
# Rounded face patch follows a deep curved surface, with a subtle cheek contour.
v=[(0,-.625,1.73)];f=[];ns=64;nr=20
for j in range(1,nr+1):
 r=j/nr
 for i in range(ns):
  a=2*pi*i/ns;x=.635*r*cos(a)*(1-.075*sin(a));z=1.73+.56*r*sin(a);y=-.625+.29*r*r-.025*max(0,-sin(a))*r
  v.append((x,y,z))
for i in range(ns):f.append((0,1+i,1+(i+1)%ns))
for j in range(nr-1):
 for i in range(ns):a=1+j*ns+i;b=1+j*ns+(i+1)%ns;f.append((a,a+ns,b+ns,b))
mesh('Sculpted cream face',v,f,cream,'Head')
for s,tag in [(1,'L'),(-1,'R')]:
 # layered crown, fins, short articulated arms and weighted feet
 leaf('Temple leaf '+tag,(s*.48,.03,1.67),(s*1.03,.01,2.23),.22,mint,'Head',.05,.07)
 leaf('Temple lower '+tag,(s*.51,.05,1.54),(s*.90,.03,1.82),.16,light,'Head',.05,.055)
 leaf('Crown side '+tag,(s*.08,-.04,2.15),(s*.46,-.005,2.67),.16,light,'Crown',.08,.055)
 leaf('Wing upper '+tag,(s*.37,.15,1.12),(s*.94,.14,1.12),.24,mint,'Wing.'+tag,.06,.075)
 leaf('Wing lower '+tag,(s*.39,.16,1.04),(s*.78,.20,.68),.19,light,'Wing.'+tag,.04,.065)
 surface('Soft arm '+tag,(s*.48,-.18,.88),(.12,.13,.27),cream,'Arm.'+tag,.4,32,20)
 surface('Foot '+tag,(s*.25,-.12,.17),(.22,.27,.145),cream,'Foot.'+tag,.3,28,16)
 surface('Dark eye '+tag,(s*.27,-.597,1.79),(.145,.083,.185),ink,'Eye.'+tag,0,32,20)
 surface('Iris '+tag,(s*.27,-.669,1.75),(.088,.026,.095),iris,'Gaze.'+tag,0,24,16)
 surface('Pupil '+tag,(s*.27,-.692,1.79),(.07,.023,.10),ink,'Gaze.'+tag,0,24,16)
 surface('Catchlight '+tag,(s*.27-.035,-.711,1.865),(.035,.013,.04),white,'Gaze.'+tag,0,16,12)
 surface('Small catchlight '+tag,(s*.27+.038,-.703,1.738),(.014,.009,.016),white,'Gaze.'+tag,0,12,8)
 surface('Cheek '+tag,(s*.435,-.519,1.57),(.095,.012,.052),pink,'Head',0,24,12)
 tube('Eyebrow '+tag,[(s*.20,-.55,2.043),(s*.27,-.55,2.073),(s*.33,-.53,2.055)],.018,mint,'Brow.'+tag)
leaf('Crown central',(0,.05,2.20),(.03,.08,2.89),.19,dark,'Crown',.12,.075)
leaf('Forehead leaf',(0,-.32,2.08),(-.035,-.27,2.42),.12,light,'Crown',.04,.055)
leaf('Back tail',(0,.31,.55),(0,.60,.78),.14,mint,'Body',-.01,.07)
tube('Smile',[(-.095,-.615,1.55),(0,-.64,1.51),(.095,-.615,1.55)],.014,mouthmat,'Mouth')
# Sculpted leaf collar and inset compass. The needle is decorative, never a forecast.
for s in [-1,1]:leaf('Collar '+str(s),(0,-.32,1.17),(s*.33,-.24,1.14),.085,mint,'Body',.04,.035)
surface('Compass bezel',(0,-.384,.91),(.185,.064,.195),gold,'Compass',0,40,24)
surface('Compass enamel',(0,-.442,.91),(.143,.019,.15),cream,'Compass',0,32,20)
v=[(0,-.467,1.035),(-.045,-.475,.91),(0,-.482,.94),(.045,-.475,.91),(0,-.467,.785)]
mesh('Compass north needle',v,[(0,1,2),(0,2,3),(4,2,1),(4,3,2)],mint,'Compass')
surface('Compass pivot',(0,-.488,.91),(.022,.009,.022),gold,'Compass',0,16,8)
for x,z in [(-.114,.91),(.114,.91),(0,1.04),(0,.78)]:surface('Compass mark',(x,-.464,z),(.009,.006,.009),gold,'Compass',0,8,6)

def reset():
 for b in rig.pose.bones:b.rotation_mode='XYZ';b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
def pose(name,loc=None,rot=None,scale=None):
 b=rig.pose.bones[name]
 if loc:b.location=loc
 if rot:b.rotation_euler=rot
 if scale:b.scale=scale
def blink(amount):
 for side in ['L','R']:pose('Eye.'+side,scale=(1,1,max(.045,1-amount)))
def sit(amount):
 pose('Body',loc=(0,.04*amount,-.15*amount),rot=(.08*amount,0,0),scale=(1+.06*amount,1+.04*amount,1-.04*amount))
 for s,tag in [(1,'L'),(-1,'R')]:pose('Foot.'+tag,loc=(s*.045*amount,-.10*amount,0),rot=(0,0,-s*.18*amount))
def anim(name,duration,fn):
 reset();action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
 frames=round(duration*30)
 for i in range(frames+1):
  reset();t=i/frames;fn(t)
  for bone in rig.pose.bones:
   for prop in ['location','rotation_euler','scale']:bone.keyframe_insert(data_path=prop,frame=i+1,group=bone.name)
 action.use_fake_user=True
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);track.mute=True
 rig.animation_data.action=None
 return {'name':name,'duration':duration}
def idle(t):
 u=sin(t*2*pi);pose('Body',scale=(1+.008*u,1+.01*u,1+.012*u));pose('Crown',rot=(.025*sin(t*2*pi-.6),.018*u,0));blink(max(0,1-abs(t-.7)/.035))
def tilt(t):
 a=sin(pi*t)**2;pose('Head',rot=(0,.23*a,.03*a));pose('Brow.L',rot=(0,-.18*a,0));pose('Crown',rot=(0,.08*sin(pi*t*2)*a,0))
def walk(t):
 a=sin(4*pi*t);pose('Body',loc=(0,0,.035*abs(a)),rot=(0,.055*a,0));pose('Root',loc=(.10*sin(2*pi*t),0,0))
 for s,tag in [(1,'L'),(-1,'R')]:pose('Foot.'+tag,loc=(0,.09*a*s,.07*max(0,a*s)),rot=(.17*a*s,0,0));pose('Arm.'+tag,rot=(-.18*a*s,0,0));pose('Wing.'+tag,rot=(0,.08*a*s,0))
def jump(t):
 # anticipation -> ballistic flight -> landing compression -> damped recovery
 keys=[(0,0,1),(.18,-.09,.88),(.30,.10,1.08),(.49,.42,1.02),(.68,.02,.98),(.76,-.065,.89),(.87,.025,1.035),(1,0,1)]
 for a,b in zip(keys,keys[1:]):
  if a[0]<=t<=b[0]:
   f=(t-a[0])/(b[0]-a[0]);f=f*f*(3-2*f);h=a[1]+f*(b[1]-a[1]);s=a[2]+f*(b[2]-a[2]);break
 pose('Root',loc=(0,0,h));pose('Body',scale=(1/s**.5,1/s**.5,s));pose('Crown',rot=(.12*sin(t*3*pi)*sin(pi*t),0,0))
 for side,tag in [(1,'L'),(-1,'R')]:pose('Wing.'+tag,rot=(0,side*.3*sin(pi*t),0));pose('Arm.'+tag,rot=(0,side*.32*sin(pi*t),0))
def sleepy(t):
 sit(1);pose('Head',rot=(.18,0,.025*sin(2*pi*t)));blink(1);pose('Body',loc=(0,.04,-.15+.009*sin(t*2*pi)));pose('Crown',rot=(.08,0,.02*sin(2*pi*t)))
def wake(t):
 a=(1-cos(pi*t))/2;sit(1-a);blink(1-a);pose('Head',rot=(.18*(1-a),0,0));pose('Arm.L',rot=(0,.4*sin(pi*t),0));pose('Arm.R',rot=(0,-.4*sin(pi*t),0))
def pet(t):
 a=sin(pi*t);pose('Head',loc=(.03*a,-.03*a,-.035*a),rot=(0,.16*a,0));blink(.85*a);pose('Crown',rot=(.12*sin(t*3*pi)*a,0,0));pose('Body',scale=(1+.02*a,1,1-.025*a))
def wave(t):
 a=sin(pi*t)**.5;pose('Arm.L',rot=(0,-1.9*a+.17*sin(t*8*pi)*a,0));pose('Head',rot=(0,-.08*a,0));pose('Wing.L',rot=(0,-.12*a,0))
clips=[anim('Idle',4,idle),anim('Blink',.7,lambda t:blink(sin(pi*t)**6)),anim('Tilt',2.4,tilt),anim('Walk',2,walk),anim('Jump',1.6,jump),anim('Sit',1.3,lambda t:sit((1-cos(pi*t))/2)),anim('Seated',4,lambda t:(sit(1),blink(max(0,1-abs(t-.7)/.035)))),anim('Sleep',4,sleepy),anim('Wake',2,wake),anim('Pet',2,pet),anim('Wave',2.4,wave)]
reset();rig.animation_data.action=None
scene.frame_set(1);scene.frame_end=120
rig['art_status']='P0 technical art candidate; human shape/motion review required'
rig['reference']='Existing FinPilot Gate A1 Fin atlas; no existing artwork replaced'
rig['actions']=','.join(x['name'] for x in clips)
# Editable studio setup; excluded from GLB.
world=bpy.data.worlds.new('Warm studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.84,.75,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,energy,size in [('Key',(-3,-4,6),550,4),('Fill',(4,-2,3),240,3),('Rim',(0,3,5),650,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;aim(o,(0,0,1.4))
d=bpy.data.cameras.new('Portrait');camera=bpy.data.objects.new('Portrait',d);scene.collection.objects.link(camera);camera.location=(3,-6,2.8);aim(camera,(0,0,1.4));d.type='ORTHO';d.ortho_scale=3.7;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.film_transparent=True
note=bpy.data.texts.new('START_HERE');note.write('Fin P0 technical art candidate. Select Fin_Rig in Pose Mode. Action Editor contains Idle/Blink/Tilt/Walk/Jump/Sit/Seated/Sleep/Wake/Pet/Wave. Idle is active for initial playback. NLA tracks are muted to prevent overlapping actions. Editable meshes/materials and a studio camera are included. Final character art is not approved.')
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
rig.animation_data.action=bpy.data.actions['Idle']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'fin-p0.blend'))
rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'fin-p0.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_skins=True,export_morph=False)
metadata={'status':'technical-art-candidate','generator':'Blender '+bpy.app.version_string,'bones':len(arm.bones),'meshes':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'clips':clips,'bytes':(PUBLIC/'fin-p0.glb').stat().st_size}
(OUT/'model-report.json').write_text(json.dumps(metadata,indent=2));print(json.dumps(metadata))
