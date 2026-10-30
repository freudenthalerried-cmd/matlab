"""Procedural Blender scenes for the 3D landing page demos.

Usage: python scenes.py <out_dir> [scene ...]
Renders isometric clay-style PNGs with transparent background (Cycles, CPU).
"""
import math
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[1]
WANT = sys.argv[2:] or ["bau", "immo", "gastro", "tech"]
RES = 1000
SAMPLES = 64


# ---------- helpers ----------

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = SAMPLES
    s.cycles.use_denoising = True
    s.render.film_transparent = True
    s.render.resolution_x = s.render.resolution_y = RES
    s.view_settings.view_transform = "AgX"
    s.view_settings.look = "AgX - Medium High Contrast"
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.92, 0.94, 1.0, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.55
    s.world = world


def hexrgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1,)


_mats = {}


def mat(color, rough=0.55, metal=0.0, glass=False, emit=0.0):
    key = (color, rough, metal, glass, emit)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(color)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexrgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if glass:
        b.inputs["Transmission Weight"].default_value = 1.0
        b.inputs["IOR"].default_value = 1.45
    if emit:
        b.inputs["Emission Color"].default_value = hexrgb(color)
        b.inputs["Emission Strength"].default_value = emit
    _mats[key] = m
    return m


def bevel(o, w=0.04, seg=4):
    mod = o.modifiers.new("b", "BEVEL")
    mod.width = w
    mod.segments = seg
    mod.limit_method = "ANGLE"
    return o


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def box(loc, size, color, b=0.04, **kw):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat(color, **kw))
    if b:
        smooth(bevel(o, b))
    return o


def cyl(loc, r, h, color, verts=48, b=0.02, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    o = bpy.context.object
    o.data.materials.append(mat(color, **kw))
    if b:
        bevel(o, b, 3)
    smooth(o)
    o.data.polygons.foreach_set("use_smooth", [True] * len(o.data.polygons))
    return o


def sphere(loc, r, color, scale=(1, 1, 1), **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=48, ring_count=24)
    o = bpy.context.object
    o.scale = scale
    o.data.materials.append(mat(color, **kw))
    return smooth(o)


def cone(loc, r, h, color, **kw):
    bpy.ops.mesh.primitive_cone_add(radius1=r, depth=h, location=loc, vertices=32)
    o = bpy.context.object
    o.data.materials.append(mat(color, **kw))
    return smooth(o)


def torus(loc, R, r, color, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=64, minor_segments=24)
    o = bpy.context.object
    o.data.materials.append(mat(color, **kw))
    return smooth(o)


def tree(x, y, z=0.0, s=1.0, leaf="#7fc8a9"):
    cyl((x, y, z + 0.25 * s), 0.06 * s, 0.5 * s, "#b98b6a", verts=16, b=0)
    sphere((x, y, z + 0.75 * s), 0.32 * s, leaf, rough=0.7)


def base(size, color="#eef1f6", h=0.3, side="#d9dfe9"):
    box((0, 0, -h / 2), (size[0], size[1], h), side, b=0.08)
    box((0, 0, 0.005), (size[0] - 0.06, size[1] - 0.06, 0.01), color, b=0)


def lights_and_camera(target=(0, 0, 1), dist=14.0, ortho=7.5):
    s = bpy.context.scene
    bpy.ops.object.light_add(type="AREA", location=(6, -4, 9))
    key = bpy.context.object
    key.data.energy = 1400
    key.data.size = 6
    key.data.color = (1.0, 0.96, 0.9)
    key.rotation_euler = (Vector(target) - key.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.light_add(type="AREA", location=(-7, 5, 5))
    fill = bpy.context.object
    fill.data.energy = 500
    fill.data.size = 8
    fill.data.color = (0.85, 0.9, 1.0)
    fill.rotation_euler = (Vector(target) - fill.location).to_track_quat("-Z", "Y").to_euler()
    # shadow catcher so the object casts soft shadow on transparent bg
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.31))
    bpy.context.object.is_shadow_catcher = True
    # isometric-ish orthographic camera
    d = dist / math.sqrt(3)
    bpy.ops.object.camera_add(location=(target[0] + d, target[1] - d, target[2] + d * 0.95))
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ortho
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat("-Z", "Y").to_euler()
    s.camera = cam


def render(name):
    bpy.context.scene.render.filepath = f"{OUT}/{name}.png"
    bpy.ops.render.render(write_still=True)


# ---------- scenes ----------

def scene_bau():
    """House under construction: walls, scaffold, crane, materials."""
    base((6, 6))
    box((0.3, 0.2, 0.15), (3.4, 2.8, 0.3), "#c9ced6")                       # slab
    box((0.3, 1.5, 1.1), (3.4, 0.2, 1.6), "#f2e6d8")                        # back wall
    box((-1.3, 0.2, 1.1), (0.2, 2.8, 1.6), "#f2e6d8")                       # left wall
    box((1.9, 0.9, 0.75), (0.2, 1.4, 0.9), "#f2e6d8")                       # half wall
    for i in range(4):                                                      # brick stack
        box((1.5, -0.6, 0.42 + i * 0.13), (0.7, 0.5, 0.12), "#e07a5f", b=0.02)
    for x in (-1.6, -0.6, 0.4, 1.4):                                        # scaffold poles
        cyl((x, -1.35, 1.0), 0.03, 2.0, "#f2b134", verts=12, b=0, metal=0.3, rough=0.4)
    for z in (0.8, 1.6):
        box((-0.1, -1.35, z), (3.2, 0.35, 0.05), "#b5835a", b=0.01)
    # crane
    cyl((-2.3, 2.2, 1.6), 0.09, 3.2, "#f2b134", verts=16, b=0, rough=0.4)
    box((-1.1, 2.2, 3.25), (3.6, 0.16, 0.16), "#f2b134", b=0.02, rough=0.4)
    box((-3.0, 2.2, 3.25), (0.7, 0.4, 0.4), "#3d4a5c", b=0.04)
    cyl((0.4, 2.2, 2.75), 0.012, 1.0, "#3d4a5c", verts=8, b=0)
    box((0.4, 2.2, 2.2), (0.5, 0.5, 0.12), "#3d4a5c", b=0.02)
    # helmet + cones
    sphere((2.2, -2.0, 0.12), 0.22, "#f2b134", scale=(1, 1, 0.7), rough=0.3)
    for x, y in ((-2.2, -2.2), (-1.7, -2.4)):
        cone((x, y, 0.22), 0.16, 0.45, "#ff7a3d", rough=0.4)
    tree(2.4, 2.3, s=1.1)
    tree(-2.5, -0.6, s=0.8)
    lights_and_camera(target=(0, 0, 1.1), ortho=8.6)


def scene_immo():
    """Modern villa with flat roofs, glass, pool."""
    base((7, 6), color="#e7efe4", side="#cfd9cc")
    box((-0.6, 0.6, 0.7), (3.6, 2.6, 1.4), "#fbfaf7")                       # ground floor
    box((0.4, 1.0, 1.85), (2.8, 2.0, 0.9), "#fbfaf7")                       # upper floor
    box((-0.6, 0.6, 1.45), (3.8, 2.8, 0.1), "#3d4a5c", b=0.02)              # roof slab
    box((0.4, 1.0, 2.35), (3.0, 2.2, 0.1), "#3d4a5c", b=0.02)
    box((-0.6, -0.71, 0.65), (2.6, 0.04, 1.0), "#9fc5e8", b=0, glass=True, rough=0.05)
    box((0.9, -0.01, 1.85), (1.6, 0.04, 0.6), "#9fc5e8", b=0, glass=True, rough=0.05)
    box((1.21, 0.6, 0.65), (0.04, 1.6, 1.0), "#9fc5e8", b=0, glass=True, rough=0.05)
    box((-2.0, 0.6, 0.7), (0.8, 2.62, 1.38), "#b5835a", b=0.02)            # wood cladding
    # pool
    box((2.3, -1.4, 0.05), (2.0, 2.2, 0.1), "#e2e6ea", b=0.03)
    box((2.3, -1.4, 0.08), (1.7, 1.9, 0.06), "#4fb3d9", b=0.01, rough=0.05, metal=0.0)
    box((2.3, 0.15, 0.12), (1.0, 0.5, 0.06), "#fbfaf7", b=0.02)             # deck chair-ish
    tree(-2.8, -2.2, s=1.2)
    tree(-2.9, 2.3, s=0.9)
    tree(3.0, 2.3, s=1.0, leaf="#5fae8b")
    box((-1.2, -2.2, 0.03), (0.8, 1.4, 0.04), "#d9cbb8", b=0.01)            # path
    lights_and_camera(target=(0, 0, 0.9), ortho=8.8)


def scene_gastro():
    """Coffee cup, saucer, croissant, cake slice on a table top."""
    base((5, 5), color="#f6efe6", side="#e3d6c6")
    cyl((-0.4, 0.2, 0.06), 1.05, 0.08, "#ffffff", rough=0.25)               # saucer
    cup = cyl((-0.4, 0.2, 0.75), 0.62, 1.2, "#fffaf3", rough=0.2, b=0.05)
    sol = cup.modifiers.new("s", "SOLIDIFY")
    sol.thickness = 0.06
    cyl((-0.4, 0.2, 1.22), 0.57, 0.04, "#6b3e26", b=0, rough=0.15)          # coffee
    torus((0.3, 0.2, 0.8), 0.28, 0.07, "#fffaf3", rot=(math.pi / 2, 0, 0), rough=0.2)
    # croissant: bent chain of spheres
    for i in range(7):
        a = math.radians(-60 + i * 20)
        r = 0.32 if 1 < i < 5 else 0.22
        sphere((1.3 + 0.7 * math.cos(a), -1.0 + 0.7 * math.sin(a), 0.22), r, "#e2a04f",
               scale=(1, 1, 0.75), rough=0.45)
    # donut on small plate
    cyl((-1.4, -1.2, 0.05), 0.7, 0.06, "#ffffff", rough=0.25)
    torus((-1.4, -1.2, 0.2), 0.36, 0.17, "#d9a066", rough=0.5)
    icing = torus((-1.4, -1.2, 0.26), 0.36, 0.15, "#f49ac1", rough=0.3)
    icing.scale = (1, 1, 0.75)
    for i in range(8):
        a = i * math.pi / 4
        box((-1.4 + 0.36 * math.cos(a), -1.2 + 0.36 * math.sin(a), 0.4), (0.09, 0.03, 0.03),
            ("#ffffff", "#7c5cff", "#2de2e6")[i % 3], b=0.01)
    cyl((1.5, 1.5, 0.35), 0.3, 0.7, "#3f5f4a", b=0.03)                      # small pot
    sphere((1.5, 1.5, 0.95), 0.4, "#7fc8a9", rough=0.7)
    lights_and_camera(target=(0, 0, 0.6), ortho=6.4)


def scene_tech():
    """Floating phone with UI cards and glossy shapes."""
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 1.6))
    ph = bpy.context.object
    ph.scale = (0.9, 0.08, 1.8)
    bpy.ops.object.transform_apply(scale=True)
    ph.data.materials.append(mat("#1b1e2b", rough=0.25, metal=0.6))
    smooth(bevel(ph, 0.18, 8))
    screen = box((0, -0.085, 1.6), (1.62, 0.01, 3.4), "#7c5cff", b=0, emit=1.2)
    screen.parent = ph
    screen.matrix_parent_inverse = ph.matrix_world.inverted()
    for i, (z, w, c) in enumerate(((2.6, 1.3, "#ffffff"), (2.0, 1.3, "#2de2e6"), (1.4, 0.9, "#ffffff"))):
        card = box((0, -0.1, z), (w, 0.02, 0.4), c, b=0.01, emit=0.4)
        card.parent = ph
        card.matrix_parent_inverse = ph.matrix_world.inverted()
    ph.rotation_euler = (math.radians(10), 0, math.radians(38))
    # floating elements
    torus((1.5, 0.4, 2.6), 0.45, 0.16, "#2de2e6", rot=(1.0, 0.4, 0), rough=0.15)
    sphere((-1.5, -0.2, 3.0), 0.38, "#ff6b8a", rough=0.15)
    sphere((-1.3, 0.6, 0.6), 0.25, "#ffc928", rough=0.2)
    box((1.7, 0.7, 0.5), (0.55, 0.55, 0.55), "#7c5cff", b=0.12, rough=0.15)
    cone((-1.7, -0.8, 1.7), 0.3, 0.5, "#2de2e6", rough=0.2)
    lights_and_camera(target=(0, 0, 1.7), ortho=5.6)


def scene_studio():
    """Pixelwerkstatt hero: desk with monitor showing a landing page, floating pixel cubes."""
    base((4.8, 3.8), color="#f4f6f8", side="#d8dee6")
    box((0, 0.6, 0.25), (3.6, 1.8, 0.1), "#c98f5e", b=0.03)                  # desk top
    for x in (-1.6, 1.6):
        box((x, 0.6, 0.1), (0.12, 1.6, 0.2), "#3d4a5c", b=0.02)
    # monitor
    box((0, 1.15, 0.36), (0.9, 0.5, 0.06), "#2b3340", b=0.02, metal=0.4, rough=0.3)
    box((0, 1.2, 0.75), (0.12, 0.08, 0.8), "#2b3340", b=0.02, metal=0.4, rough=0.3)
    box((0, 1.1, 1.45), (2.6, 0.12, 1.55), "#1b1f27", b=0.06, rough=0.3)
    box((0, 1.035, 1.45), (2.42, 0.01, 1.38), "#f7f8fa", b=0, emit=0.35)
    box((-0.45, 1.025, 1.75), (1.2, 0.01, 0.2), "#121a24", b=0, emit=0.2)    # headline bar
    box((-0.6, 1.025, 1.48), (0.9, 0.01, 0.08), "#9aa6b5", b=0, emit=0.2)
    box((-0.75, 1.025, 1.25), (0.6, 0.01, 0.16), "#ff5a1f", b=0, emit=0.6)   # cta
    box((0.62, 1.02, 1.42), (0.75, 0.02, 0.75), "#1aa39a", b=0.01, emit=0.4)  # hero image
    # keyboard, mug, plant
    box((-0.2, 0.1, 0.33), (1.4, 0.45, 0.06), "#e6e9ee", b=0.02)
    cup = cyl((1.15, 0.05, 0.47), 0.17, 0.34, "#ff5a1f", b=0.02, rough=0.3)
    torus((1.33, 0.05, 0.48), 0.09, 0.03, "#ff5a1f", rot=(math.pi / 2, 0, 0), rough=0.3)
    cyl((-1.35, 1.0, 0.45), 0.2, 0.3, "#f7f8fa", b=0.03)
    sphere((-1.35, 1.0, 0.8), 0.32, "#7fc8a9", rough=0.7)
    # floating pixel cubes rising out of the screen corner
    pix = [((1.35, 0.8, 2.35), 0.34, "#ff5a1f"), ((1.85, 0.35, 2.85), 0.26, "#1aa39a"),
           ((1.2, 0.1, 3.2), 0.22, "#ffc928"), ((2.2, 0.9, 3.35), 0.18, "#ff5a1f"),
           ((1.65, -0.2, 3.65), 0.15, "#121a24"), ((2.35, 0.2, 2.3), 0.22, "#ffc928")]
    for loc, s, c in pix:
        o = box(loc, (s, s, s), c, b=0.02, rough=0.25)
        o.rotation_euler = (0.3, 0.2, 0.5)
    tree(1.9, -1.3, s=0.8)
    lights_and_camera(target=(-0.1, -0.1, 1.15), ortho=7.2)


SCENES = {"studio": scene_studio, "bau": scene_bau, "immo": scene_immo, "gastro": scene_gastro, "tech": scene_tech}

for name in WANT:
    reset()
    SCENES[name]()
    render(name)
