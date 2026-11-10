"""P0.5 BASE CANDIDATE authoring tool; never overwrites artist-edited source.
Outputs a versioned candidate directory. Sculpt/paint edits belong in a separate
artist-master.blend, exported with export-fin-p05.py, not rebuilt with this tool.
"""
import bpy,bmesh,math,json,sys,hashlib
from pathlib import Path
from mathutils import Vector
from math import sin,cos,pi,sqrt
ROOT=Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
VERSION=args[0] if args else 'candidate-01'
OUT=ROOT/'assets/fin-3d-p05'/VERSION
if (OUT/'fin-p05-source.blend').exists():raise RuntimeError('Refusing to overwrite an existing editable source. Choose a new candidate name.')
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=30
def material(name,color,rough=.7,metal=0,vertex=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Specular IOR Level'].default_value=.25
 if vertex:
  c=m.node_tree.nodes.new('ShaderNodeVertexColor');c.layer_name='FinColor';m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color'])
 return m
CREAM=(.91,.845,.66);MINT=(.055,.40,.29);TIP=(.30,.61,.30)
skin=material('01 warm soft matte',CREAM,.8,vertex=True)
leafmat=material('02 mint leaf satin',MINT,.58,vertex=True);leafmat.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=.075
eye=material('03 deep warm eye',(.009,.016,.018),.28)
iris=material('04 amber iris',(.10,.057,.018),.35,vertex=True)
white=material('05 small soft catchlight',(.98,.95,.83),.38)
mouthmat=material('06 mouth velvet',(.105,.025,.018),.82)
gold=material('07 brushed amber',(.72,.38,.065),.5,.28)
enamel=material('08 ivory enamel',(.87,.80,.59),.55)
veinmat=material('09 leaf midrib',(.16,.47,.30),.75)
meshes=[];morphs=[]
arm=bpy.data.armatures.new('Fin_P05_DeformRig');rig=bpy.data.objects.new('Fin_Rig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
spec=[('Root',(0,0,0),None),('Body',(0,0,.43),'Root'),('Head',(0,0,1.18),'Body'),('Crown',(0,0,2.12),'Head'),('Wing.L',(.35,.18,.92),'Body'),('Wing.R',(-.35,.18,.92),'Body'),('Arm.L',(.36,-.01,.88),'Body'),('Arm.R',(-.36,-.01,.88),'Body'),('Foot.L',(.23,-.05,.12),'Root'),('Foot.R',(-.23,-.05,.12),'Root'),('Compass',(0,-.37,.74),'Body'),('Gaze.L',(.285,-.5,1.57),'Head'),('Gaze.R',(-.285,-.5,1.57),'Head')]
for name,pos,parent in spec:
 b=arm.edit_bones.new(name);b.head=pos;b.tail=Vector(pos)+Vector((0,.12,0))
 if parent:b.parent=arm.edit_bones[parent]
for s,tag in [(1,'L'),(-1,'R')]:
 hip=arm.edit_bones.new('Thigh.'+tag);hip.head=(s*.23,0,.50);hip.tail=(s*.23,-.09,.30);hip.parent=arm.edit_bones['Body']
 shin=arm.edit_bones.new('Shin.'+tag);shin.head=hip.tail;shin.tail=(s*.23,-.05,.12);shin.parent=hip;shin.use_connect=True
 pole=arm.edit_bones.new('KneeGuide.'+tag);pole.head=(s*.23,-.65,.28);pole.tail=(s*.23,-.65,.38);pole.parent=arm.edit_bones['Root'];pole.use_deform=False
bpy.ops.object.mode_set(mode='POSE')
for tag in ['L','R']:
 con=rig.pose.bones['Shin.'+tag].constraints.new('IK');con.name='Foot contact two-link IK';con.target=rig;con.subtarget='Foot.'+tag;con.chain_count=2;con.use_stretch=False
 # The slightly forward rest knee defines the bend plane without a hard pole snap.
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def mesh(name,verts,faces,mat,bone,colors=None,targets=None,weights=None):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
 bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);d.materials.append(mat)
 for p in d.polygons:p.use_smooth=True
 c=d.color_attributes.new(name='FinColor',type='FLOAT_COLOR',domain='POINT')
 for i in range(len(verts)):c.data[i].color=(*(colors[i] if colors else CREAM),1)
 if weights:
  for group,values in weights.items():
   g=o.vertex_groups.new(name=group)
   for i,w in enumerate(values):
    if w>0:g.add([i],w,'REPLACE')
 else:o.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
 mod=o.modifiers.new('Editable skin','ARMATURE');mod.object=rig;o.parent=rig
 if targets:
  o.shape_key_add(name='Basis')
  for key,coords in targets.items():
   k=o.shape_key_add(name=key)
   for p,co in zip(k.data,coords):p.co=co
  morphs.append(o)
 meshes.append(o);return o
def lerp(a,b,t):return a+(b-a)*t
def smooth(a,b,t):
 q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
def mix(a,b,t):return tuple(lerp(x,y,t) for x,y in zip(a,b))
def spow(x,p):return (1 if x>=0 else -1)*abs(x)**p
def oval(name,center,scale,mat,bone,segments=28,rings=16,flat=False,color=None):
 v=[];f=[]
 for j in range(rings+1):
  ph=pi*j/rings
  for i in range(segments):
   th=2*pi*i/segments;z=center[2]+scale[2]*cos(ph)
   if flat:z=max(.012,z)
   v.append((center[0]+scale[0]*sin(ph)*cos(th),center[1]+scale[1]*sin(ph)*sin(th),z))
 for j in range(rings):
  for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;f.append((a,b,b+segments,a+segments))
 return mesh(name,v,f,mat,bone,[color or CREAM]*len(v))
def tube(name,points,radius,mat,bone):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=8;cu.bevel_depth=radius;cu.bevel_resolution=2;sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
 for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,cu);scene.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);o.data.materials.append(mat);o.vertex_groups.new(name=bone).add(list(range(len(o.data.vertices))),1,'REPLACE');m=o.modifiers.new('Skin','ARMATURE');m.object=rig;o.parent=rig;meshes.append(o);return o
def leaf(name,start,tip,width,bone,bend=.09,depth=.065,base=MINT):
 start=Vector(start);axis=Vector(tip)-start;side=Vector((axis.z,0,-axis.x)).normalized();v=[];f=[];colors=[];n=22;ns=10
 for j in range(n+1):
  t=j/n;w=width*sin(pi*t)**.68+.001;c=start+axis*t+Vector((0,-bend*sin(pi*t),.035*sin(pi*t)))
  for i in range(ns):
   a=2*pi*i/ns;p=c+side*(w*cos(a))+Vector((0,depth*sin(pi*t)**.65*sin(a),0));v.append(tuple(p));colors.append(mix(base,TIP,.16+.40*t+.10*cos(a)))
 for j in range(n):
  for i in range(ns):a=j*ns+i;b=j*ns+(i+1)%ns;f.append((a,b,b+ns,a+ns))
 mesh(name,v,f,leafmat,bone,colors)
 def line(t,u=0):return tuple(start+axis*t+side*u+Vector((0,-(bend+depth)*sin(pi*t)-.003,.035*sin(pi*t))))
 tube(name+' soft midrib',[line(t) for t in [.07,.28,.55,.78,.94]],.0045,veinmat,bone)
 for t in [.35,.57]:
  for s in [-1,1]:tube(name+' branch',[line(t),line(t+.10,s*width*.38),line(t+.18,s*width*.53)],.0023,veinmat,bone)

# One continuous head surface: cream and green are vertex colours, not two shells.
HC=1.57;HX=.77;HZ=.63;HY=.51;EXP=.88
def face_y(x,z):
 q=max(.001,1-abs(x/HX)**(2/EXP)-abs((z-HC)/HZ)**(2/EXP))
 return -HY*q**.5-.018*math.exp(-((abs(x)-.37)/.20)**2-((z-1.40)/.15)**2)
v=[];f=[];colors=[];targets={k:[] for k in ['Happy','Confused','Drowsy','Surprise']};ns=64;nr=36
for j in range(nr+1):
 ph=pi*j/nr
 for i in range(ns):
  th=2*pi*i/ns;x=HX*spow(sin(ph)*cos(th),EXP);z=HC+HZ*spow(cos(ph),EXP);y=HY*sin(ph)*sin(th)
  if y<0:y=face_y(x,z)
  v.append((x,y,z));r=((x/.67)**2+((z-HC)/.53)**2)**.5;mask=(1-smooth(.96,1.04,r))*(1-smooth(-.10,.02,y));col=mix(MINT,CREAM,mask)
  blush=math.exp(-((abs(x)-.41)/.085)**2-((z-1.40)/.065)**2)*(1-smooth(-.1,0,y));col=mix(col,(.88,.40,.27),.38*blush);colors.append(col)
  cheek=math.exp(-((abs(x)-.34)/.18)**2-((z-1.40)/.18)**2)*mask
  targets['Happy'].append((x,y-.014*cheek,z+.023*cheek));targets['Drowsy'].append((x,y,z-.009*cheek));targets['Confused'].append((x,y,z+.012*cheek*(1 if x<0 else -.4)));targets['Surprise'].append((x,y-.006*cheek,z-.008*cheek))
for j in range(nr):
 for i in range(ns):a=j*ns+i;b=j*ns+(i+1)%ns;f.append((a,b,b+ns,a+ns))
mesh('Head continuous sculpt surface',v,f,skin,'Head',colors,targets)

# Short organic torso, shoulders and flat-soled feet. No separate face disc.
v=[];f=[];ns=40;nr=26
for j in range(nr+1):
 t=j/nr;z=.16+.91*t;r=sin(pi*t)**.63;rx=.46*r*(1-.24*t);ry=.34*r
 for i in range(ns):
  a=2*pi*i/ns;x=rx*cos(a);y=ry*sin(a)-.025*sin(pi*t);v.append((x,y,z))
for j in range(nr):
 for i in range(ns):a=j*ns+i;b=j*ns+(i+1)%ns;f.append((a,b,b+ns,a+ns))
mesh('Torso sculpt cage',v,f,skin,'Body')
for s,tag in [(1,'L'),(-1,'R')]:
 # Shoulder to palm is a bent swept volume, not a hanging straight ellipsoid.
 verts=[];faces=[];n=22;ns=14
 for j in range(n+1):
  t=j/n;c=Vector((s*(.31+.18*sin(t*pi*.8)),-.035-.12*t,.93-.43*t));r=.115*sin(pi*t)**.45+.002
  for i in range(ns):a=2*pi*i/ns;verts.append(tuple(c+Vector((r*cos(a),r*.88*sin(a),.025*cos(a)))))
 for j in range(n):
  for i in range(ns):a=j*ns+i;b=j*ns+(i+1)%ns;faces.append((a,b,b+ns,a+ns))
 mesh('Bent shoulder arm '+tag,verts,faces,skin,'Arm.'+tag)
 leg=oval('Soft short leg '+tag,(s*.23,-.01,.30),(.135,.13,.23),skin,'Thigh.'+tag,24,16)
 leg.vertex_groups.clear();a=leg.vertex_groups.new(name='Thigh.'+tag);b=leg.vertex_groups.new(name='Shin.'+tag)
 for vert in leg.data.vertices:
  w=smooth(.23,.42,vert.co.z);a.add([vert.index],w,'REPLACE');b.add([vert.index],1-w,'REPLACE')
 oval('Flat padded sole '+tag,(s*.23,-.09,.12),(.19,.235,.12),skin,'Foot.'+tag,32,18,flat=True)
 # Side fins sit behind the face; asymmetric layers are concentrated at shoulders.
 leaf('Ear fin '+tag,(s*.60,.09,1.64),(s*.98,.24,1.94),.19,'Head',.045,.06)
 leaf('Back wing upper '+tag,(s*.32,.24,.99),(s*.91,.37,1.02),.22,'Wing.'+tag,.04,.065)
 leaf('Back wing lower '+tag,(s*.34,.25,.93),(s*.70,.41,.60),.17,'Wing.'+tag,.01,.055,base=(.08,.44,.29))
leaf('Crown tall rear',(0,.18,2.04),(.045,.23,2.69),.16,'Crown',.08,.065,base=(.018,.24,.18))
leaf('Crown left forward',(-.08,-.03,2.06),(-.39,.025,2.48),.145,'Crown',.10,.05)
leaf('Crown right sweep',(.07,.03,2.08),(.36,.14,2.43),.14,'Crown',.05,.055)
leaf('Forehead small curl',(.01,-.28,2.08),(-.09,-.20,2.32),.085,'Crown',.08,.045)
leaf('Small back tail',(0,.28,.44),(0,.51,.63),.105,'Body',-.025,.05)

def eye_y(x,z,cx):
 r=((x-cx)/.14)**2+((z-1.60)/.185)**2
 return face_y(x,z)-.015-.025*max(0,1-r)
def disk(name,cx,cz,rx,rz,mat,bone,yfn,colorsfn=None):
 verts=[];faces=[];cols=[];n=10;ns=36
 for j in range(n+1):
  r=max(.0001,j/n)
  for i in range(ns):
   a=i*2*pi/ns;x=cx+rx*r*cos(a);z=cz+rz*r*sin(a);verts.append((x,yfn(x,z,r),z));cols.append(colorsfn(r,a) if colorsfn else CREAM)
 for j in range(n):
  for i in range(ns):a=j*ns+i;b=j*ns+(i+1)%ns;faces.append((a,b,b+ns,a+ns))
 return mesh(name,verts,faces,mat,bone,cols)
for s,tag in [(1,'L'),(-1,'R')]:
 cx=s*.285
 disk('Inset eye '+tag,cx,1.60,.14,.185,eye,'Head',lambda x,z,r,cx=cx:eye_y(x,z,cx))
 disk('Iris gradient '+tag,cx,1.565,.080,.10,iris,'Gaze.'+tag,lambda x,z,r,cx=cx:eye_y(x,z,cx)-.003,lambda r,a:mix((.14,.067,.019),(.035,.027,.016),r*.8+.10*sin(a)))
 disk('Pupil '+tag,cx,1.61,.059,.087,eye,'Gaze.'+tag,lambda x,z,r,cx=cx:eye_y(x,z,cx)-.005)
 for dx,dz,rx,rz in [(-.035,.065,.026,.030),(.036,-.065,.010,.012)]:disk('Cornea glint '+tag,cx+dx,1.60+dz,rx,rz,white,'Gaze.'+tag,lambda x,z,r,cx=cx:eye_y(x,z,cx)-.007)
 # Upper and lower lids slide on the eye surface via morphs; eyeballs do not flatten.
 for upper in [True,False]:
  def lidcoords(close):
   a=[]
   for row in range(7):
    t=row/6
    for i in range(29):
     u=-.997+1.994*i/28;x=cx+.148*u;edge=.194*sqrt(max(0,1-u*u));outer=1.60+(edge if upper else -edge);meet=1.60-.01+.014*(1-u*u)
     z=lerp(outer,lerp(outer,meet,close),t);y=eye_y(x,z,cx)-.013-.006*sin(pi*t);a.append((x,y,z))
   return a
  verts=lidcoords(.025);faces=[]
  for row in range(6):
   for i in range(28):a=row*29+i;faces.append((a,a+1,a+30,a+29))
  targets={'Blink'+tag:lidcoords(1),'Happy':lidcoords(.35 if upper else .40),'Drowsy':lidcoords(.74 if upper else .15),'Confused':lidcoords(.27 if s<0 and upper else .025),'Surprise':lidcoords(.025)}
  mesh(('Upper eyelid ' if upper else 'Lower eyelid ')+tag,verts,faces,skin,'Head',targets=targets)
 # Brows use the same expressive keys, following the head surface.
 verts=[];faces=[];target={k:[] for k in ['Happy','Confused','Drowsy','Surprise']}
 for j in range(17):
  t=j/16;x=cx-.085+.17*t;z=1.85+.025*sin(pi*t)
  for k in range(6):
   a=k*pi/3;v=(x,face_y(x,z)-.009+.008*cos(a),z+.009*sin(a));verts.append(v)
   for name in target:
    dz={'Happy':.018,'Drowsy':-.035,'Confused':(.035*(1-t) if s<0 else -.018*t),'Surprise':.05}[name];target[name].append((v[0],face_y(x,z+dz)-.009+.008*cos(a),v[2]+dz))
 for j in range(16):
  for k in range(6):a=j*6+k;b=j*6+(k+1)%6;faces.append((a,b,b+6,a+6))
 mesh('Expressive brow '+tag,verts,faces,leafmat,'Head',[MINT]*len(verts),target)
# Mouth shape and cheek lifts cooperate, with an actual opening rather than a rigid wire.
verts=[];faces=[];target={k:[] for k in ['Happy','Confused','Drowsy','Surprise']};n=36
for j in range(9):
 r=max(.001,j/8)
 for i in range(n):
  a=i*2*pi/n;x=.074*r*cos(a);z=1.355+.020*r*sin(a)+.035*(x/.074)**2;verts.append((x,face_y(x,z)-.008,z))
  for key in target:
   rx,rz,shift={'Happy':(.090,.052,0),'Confused':(.033,.025,.022),'Drowsy':(.048,.009,0),'Surprise':(.034,.048,0)}[key];xx=shift+rx*r*cos(a);zz=1.35+rz*r*sin(a)+(.025*(xx/rx)**2 if key=='Happy' else 0);target[key].append((xx,face_y(xx,zz)-.010,zz))
for j in range(8):
 for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
mesh('Expression mouth',verts,faces,mouthmat,'Head',targets=target)

# Compass: raised rim, inset face, four-way enamel star and small cardinal ticks.
for s in [-1,1]:leaf('Collar '+str(s),(0,-.25,.99),(s*.30,-.18,.98),.06,'Body',.025,.025)
cx,cy,cz=0,-.335,.74
for rad,depth,mat in [(.165,.040,gold),(.133,.014,enamel)]:
 oval('Compass bezel' if mat==gold else 'Compass inset',(0,cy-(.035 if mat==enamel else 0),cz),(rad,depth,rad),mat,'Compass',40,16)
ring=[(.147*cos(i*2*pi/48),cy-.040,cz+.147*sin(i*2*pi/48)) for i in range(49)];tube('Raised compass rim',ring,.009,gold,'Compass')
verts=[(0,cy-.060,cz)];faces=[]
for i in range(8):
 a=pi/2+i*pi/4;r=.104 if i%2==0 else .033;verts.append((r*cos(a),cy-.048,cz+r*sin(a)))
for i in range(8):faces.append((0,1+i,1+(i+1)%8))
mesh('Four point compass star',verts,faces,leafmat,'Compass',[MINT]*len(verts))
oval('Compass spindle',(0,cy-.065,cz),(.017,.009,.017),gold,'Compass',16,8)
for i in range(8):
 a=i*pi/4;tube('Compass tick',[(.118*cos(a),cy-.051,cz+.118*sin(a)),(.129*cos(a),cy-.050,cz+.129*sin(a))],.0035,gold,'Compass')

def reset():
 for b in rig.pose.bones:b.rotation_mode='XYZ';b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
 for o in morphs:
  for k in o.data.shape_keys.key_blocks[1:]:k.value=0
def pose(n,loc=None,rot=None,scale=None):
 b=rig.pose.bones[n]
 if loc is not None:b.location=loc
 if rot is not None:b.rotation_euler=rot
 if scale is not None:b.scale=scale
def expression(name,value=1):
 for o in morphs:
  key=o.data.shape_keys.key_blocks.get(name)
  if key:key.value=max(0,min(1,value))
def blink(value,left=True,right=True):
 if left:expression('BlinkL',value)
 if right:expression('BlinkR',value)
def sit(a):
 pose('Body',loc=(0,.025*a,-.12*a),rot=(.05*a,0,0),scale=(1+.045*a,1+.025*a,1-.03*a))
 for s,tag in [(1,'L'),(-1,'R')]:pose('Foot.'+tag,loc=(s*.015*a,-.065*a,0));pose('Arm.'+tag,rot=(0,s*.22*a,0))
def curl(a):
 sit(1);pose('Body',loc=(0,.025,-.135-.005*a),rot=(.05+.12*a,0,0));pose('Head',loc=(0,-.11*a,-.19*a),rot=(.38*a,.14*a,0));blink(a);expression('Drowsy',a)
 for s,tag in [(1,'L'),(-1,'R')]:pose('Arm.'+tag,rot=(-.20*a,-s*.75*a,0));pose('Wing.'+tag,rot=(.10*a,s*.24*a,0))
 pose('Crown',rot=(.14*a,0,.025*a))
def idle(t):
 a=sin(2*pi*t);pose('Body',scale=(1+.004*a,1+.008*a,1+.006*a));pose('Head',rot=(.008*sin(t*2*pi-.3),.012*a,0));pose('Crown',rot=(.018*sin(t*2*pi-.8),.014*sin(t*2*pi-.5),0))
 blink(max(0,1-abs(t-.37)/.025));
 for s,tag in [(1,'L'),(-1,'R')]:pose('Wing.'+tag,rot=(.012*sin(t*2*pi-.7),s*.018*sin(t*2*pi-.4),0))
def tilt(t):
 a=smooth(.05,.30,t)*(1-smooth(.66,1,t));pose('Head',rot=(-.025*a,.20*a,.025*a));expression('Confused',a);pose('Crown',rot=(0,.045*sin(t*4*pi)*a,0));blink(max(0,1-abs(t-.82)/.035))
def walk(t):
 # Four real fore/aft steps. Support feet are fixed in world coordinates.
 phase=max(0,min(3.999,(t-.08)/.84*4));step=int(phase);u=phase-step
 if t<.08:step=0;u=0
 if t>.92:step=3;u=1
 positions={'L':0.,'R':0.};moves=[('L',-.24),('R',-.24),('L',0.),('R',0.)]
 for k in range(step):positions[moves[k][0]]=moves[k][1]
 who,target=moves[step];start=positions[who];positions[who]=lerp(start,target,smooth(0,1,u));root_y=sum(positions.values())/2
 pose('Root',loc=(0,root_y,0));lift=.075*sin(pi*u)**1.5;pose('Body',loc=((-.018 if who=='L' else .018)*sin(pi*u),0,.012*sin(pi*u)),rot=(.025*sin(pi*u),0,0))
 for s,tag in [(1,'L'),(-1,'R')]:
  pose('Foot.'+tag,loc=(0,positions[tag]-root_y,lift if tag==who else 0));pose('Arm.'+tag,rot=(s*.10*sin(phase*pi),0,0));pose('Wing.'+tag,rot=(0,s*.035*sin(phase*pi-.6),0))
 pose('Crown',rot=(.025*sin(phase*pi-.5),0,0))
def jump(t):
 # 0-.25 anticipation; .25-.66 ballistic arc; .66-.83 compression; .83-1 settle.
 air=sin(pi*(t-.25)/.41) if .25<t<.66 else 0;h=.32*air
 crouch=.095*(smooth(0,.20,t)-smooth(.20,.29,t))+.075*(smooth(.64,.70,t)-smooth(.73,.91,t))
 pose('Root',loc=(0,0,h));pose('Body',loc=(0,0,-crouch),scale=(1+crouch*.45,1+crouch*.3,1-crouch*.55));pose('Head',rot=(.07*crouch/.1,0,0));expression('Happy',.8*sin(pi*t));pose('Crown',rot=(.11*sin(t*4*pi)*sin(pi*t),0,0))
 for s,tag in [(1,'L'),(-1,'R')]:pose('Arm.'+tag,rot=(0,-s*.52*air,0));pose('Wing.'+tag,rot=(0,-s*.20*sin(pi*t),0))
def pet(t):
 surprise=smooth(0,.12,t)*(1-smooth(.15,.29,t));relax=smooth(.22,.48,t)*(1-smooth(.75,1,t));expression('Surprise',surprise);expression('Happy',.65*relax);blink(.8*relax);pose('Body',loc=(0,0,-.02*relax),scale=(1+.012*relax,1,1-.015*relax));pose('Head',loc=(0,-.025*relax,-.025*relax),rot=(-.05*relax,.045*relax,0));pose('Crown',rot=(.055*sin(t*5*pi)*relax,0,0))
def wake(t):
 a=1-smooth(.10,.72,t);curl(a);expression('Drowsy',1-smooth(.10,.56,t));blink(1-smooth(.10,.37,t));stand=smooth(.62,1,t)
 if t>.62:sit(1-stand);pose('Head',loc=(0,0,-.02*(1-stand)),rot=(0,0,0))
 for s,tag in [(1,'L'),(-1,'R')]:pose('Arm.'+tag,rot=(0,-s*.50*sin(pi*t),0))
def wave(t):
 a=sin(pi*t)**.7;pose('Arm.L',rot=(0,-1.45*a+.15*sin(8*pi*t)*a,0));expression('Happy',.55*a);pose('Head',rot=(0,-.06*a,0))

clips=[];contact_checks=[]
def animate(name,duration,fn):
 reset();rig.animation_data_create();act=bpy.data.actions.new(name);rig.animation_data.action=act
 for o in morphs:o.data.shape_keys.animation_data_create();o.data.shape_keys.animation_data.action=bpy.data.actions.new(name+' facial '+o.name)
 frames=round(duration*30)
 for i in range(frames+1):
  scene.frame_set(i+1);reset();fn(i/frames)
  for b in rig.pose.bones:
   if b.name.startswith(('Thigh','Shin','KneeGuide')):continue
   for prop in ['location','rotation_euler','scale']:b.keyframe_insert(data_path=prop,frame=i+1,group=b.name)
  for o in morphs:
   for k in o.data.shape_keys.key_blocks[1:]:k.keyframe_insert(data_path='value',frame=i+1)
  if name=='Walk':
   root=rig.pose.bones['Root'].location.copy()
   contact_checks.append({'frame':i+1,'rootY':root.y,'feet':{tag:[float(v) for v in rig.pose.bones['Foot.'+tag].location+Vector((s*.23,-.05,.12))+root] for s,tag in [(1,'L'),(-1,'R')]}})
 for target,action in [(rig,act)]+[(o.data.shape_keys,o.data.shape_keys.animation_data.action) for o in morphs]:
  action.use_fake_user=True;tr=target.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,1,action);tr.mute=True;target.animation_data.action=None
 clips.append({'name':name,'duration':duration})
for n,d,fn in [('Idle',6,idle),('Blink',.8,lambda t:blink(sin(pi*t)**4)),('Tilt',3.2,tilt),('Walk',4.6,walk),('Jump',2.4,jump),('Pet',3.6,pet),('Sit',2.1,lambda t:sit(smooth(0,1,t))),('Seated',5,lambda t:(sit(1),blink(max(0,1-abs(t-.6)/.025)))),('LieDown',3.2,lambda t:curl(smooth(0,1,t))),('Sleep',6,lambda t:(curl(1),pose('Body',loc=(0,.025,-.14+.004*sin(t*2*pi)),rot=(.17,0,0)))),('Wake',4.6,wake),('Rise',2.2,lambda t:sit(1-smooth(0,1,t))),('Wave',2.8,wave)]:animate(n,d,fn)
reset();scene.frame_set(1);scene.frame_end=180
# Neutral reproducible studio: same light/camera/scale used for old and new comparisons.
world=bpy.data.worlds.new('Neutral studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.77,.73,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Key',(-3,-4,5),430,5),('Fill',(4,-2,3),210,4),('Rim',(1,3,4),360,4)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;aim(o,(0,0,1.3))
d=bpy.data.cameras.new('Inspection camera');cam=bpy.data.objects.new('Inspection camera',d);scene.collection.objects.link(cam);cam.location=(0,-6,1.4);aim(cam,(0,0,1.4));d.type='ORTHO';d.ortho_scale=3.25;scene.camera=cam
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.004));ground=bpy.context.object;ground.name='Studio ground (not exported)';ground.data.materials.append(material('Studio neutral',(.72,.75,.70),1))
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
rig['status']='P0.5 procedural art candidate; not an approved artist-sculpted final'
rig['source_policy']='Do not rebuild over artist-master.blend; use export-fin-p05.py for edited sources.'
note=bpy.data.texts.new('ARTIST_HANDOFF');note.write('Editable separated parts, continuous coloured head surface, expression shape keys, foot-target two-bone IK, authored clips. Candidate generator refuses overwrite. Sculpt a copy named artist-master.blend; export that file, never rerun generator over it. Neutral camera and studio included for matched comparisons.')
rig.animation_data.action=bpy.data.actions['Idle']
for o in morphs:
 for tr in o.data.shape_keys.animation_data.nla_tracks:
  if tr.name=='Idle':o.data.shape_keys.animation_data.action=tr.strips[0].action
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'fin-p05-source.blend'))
(OUT/'clips.json').write_text(json.dumps(clips,indent=2));(OUT/'contact-authoring.json').write_text(json.dumps(contact_checks,indent=2))
print('SOURCE_READY',OUT,flush=True)
# Render neutral views and actual expression deformations before website integration.
for target in [rig]+[o.data.shape_keys for o in morphs]:target.animation_data.action=None
reset()
renderdir=ROOT/'docs/fin-pet-p05/blender'/VERSION;renderdir.mkdir(parents=True,exist_ok=True)
for name,angle,expr in [('front',0,None),('three-quarter',pi/4,None),('side',pi/2,None),('back',pi,None),('happy',0,'Happy'),('confused',0,'Confused'),('drowsy',0,'Drowsy')]:
 reset();expression(expr,1) if expr else None
 cam.location=(6*sin(angle),-6*cos(angle),1.4);aim(cam,(0,0,1.4));d.ortho_scale=3.25
 if expr:d.ortho_scale=1.9;cam.location=(0,-6,1.62);aim(cam,(0,0,1.62))
 bpy.context.view_layer.update();scene.render.filepath=str(renderdir/(name+'.png'));bpy.ops.render.render(write_still=True)
print('RENDERS_READY',renderdir,flush=True)
