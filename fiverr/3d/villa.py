"""Photoreal-ish villa scene for the premium scroll demo (Blender Cycles via bpy).

Usage:
  python villa.py <out_dir> test <t>          one frame at path position t (0..1), small
  python villa.py <out_dir> seq <n> [w] [h]   n frames along the path, day -> night
Frames are written as <out_dir>/f_###.png
"""
import math
import random
import sys

import bpy
from mathutils import Vector, noise

OUT, MODE = sys.argv[1], sys.argv[2]
random.seed(7)


# ---------------- helpers ----------------

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1,)


def material(name, color, rough=0.5, metal=0.0, transmission=0.0, ior=1.45, emit=None, bump=0.0, bump_scale=30.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = ior
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = 0.0
    if bump:
        n = nt.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = bump_scale
        n.inputs["Detail"].default_value = 8
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump
        nt.links.new(n.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def color_variation(m, c1, c2, scale=4.0):
    """Mix base color between c1 and c2 with large-scale noise (lawn, stone, foliage)."""
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = 6
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = srgb(c1)
    r.color_ramp.elements[1].color = srgb(c2)
    nt.links.new(n.outputs["Fac"], r.inputs["Fac"])
    nt.links.new(r.outputs["Color"], b.inputs["Base Color"])


def wood(name):
    """Vertical oak boards: wave bands + noise."""
    m = material(name, "#6b4a30", rough=0.55)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    w = nt.nodes.new("ShaderNodeTexWave")
    w.wave_type = "BANDS"
    w.bands_direction = "X"
    w.inputs["Scale"].default_value = 9.0
    w.inputs["Distortion"].default_value = 6.0
    w.inputs["Detail"].default_value = 4
    nt.links.new(tc.outputs["Object"], w.inputs["Vector"])
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = srgb("#3f2b1d")
    r.color_ramp.elements[1].color = srgb("#6a4b32")
    nt.links.new(w.outputs["Fac"], r.inputs["Fac"])
    nt.links.new(r.outputs["Color"], b.inputs["Base Color"])
    return m


def box(name, size, loc, mat, bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    if bevel:
        md = o.modifiers.new("bv", "BEVEL")
        md.width = bevel
        md.segments = 2
        md.limit_method = "ANGLE"
    return o


def area_light(loc, size, power, color="#ffcf9a", rot=(0, 0, 0)):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot)
    l = bpy.context.object
    l.data.size = size[0]
    l.data.shape = "RECTANGLE"
    l.data.size_y = size[1]
    l.data.energy = 0.0
    l.data.color = srgb(color)[:3]
    l["max"] = power
    return l


# ---------------- scene ----------------

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.cycles.transmission_bounces = 6
sc.cycles.use_adaptive_sampling = True
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.image_settings.file_format = "PNG"
sc.view_layers[0].use_pass_mist = True
sc.world = bpy.data.worlds.new("World")
sc.world.use_nodes = True
wn = sc.world.node_tree
sky = wn.nodes.new("ShaderNodeTexSky")
sky.sky_type = "MULTIPLE_SCATTERING"
sky.sun_disc = True
sky.sun_size = math.radians(0.9)
sky.altitude = 450
sky.air_density = 1.4
sky.aerosol_density = 2.2
sky.sun_rotation = math.radians(160)
night_bg = wn.nodes.new("ShaderNodeBackground")
night_bg.inputs["Color"].default_value = srgb("#1e3463")
night_bg.inputs["Strength"].default_value = 2.6
mix = wn.nodes.new("ShaderNodeMixShader")
bg = wn.nodes["Background"]
wn.links.new(sky.outputs["Color"], bg.inputs["Color"])
wn.links.new(bg.outputs[0], mix.inputs[1])
wn.links.new(night_bg.outputs[0], mix.inputs[2])
wn.links.new(mix.outputs[0], wn.nodes["World Output"].inputs["Surface"])
sc.world.mist_settings.start = 60
sc.world.mist_settings.depth = 520
sc.world.mist_settings.falloff = "QUADRATIC"

# materials
M = {
    "plaster": material("plaster", "#e8e3da", rough=0.82, bump=0.05, bump_scale=60),
    "concrete": material("concrete", "#b9b4ab", rough=0.9, bump=0.08, bump_scale=25),
    "oak": material("oak", "#4a3526", rough=0.6, bump=0.04, bump_scale=40),
    "frame": material("frame", "#1d1f22", rough=0.35, metal=0.8),
    "glass": material("glass", "#dfe9ee", rough=0.0, transmission=1.0, ior=1.5),
    "floor": material("floor", "#b08a62", rough=0.4),
    "sofa": material("sofa", "#d8d0c4", rough=0.95),
    "dark": material("dark", "#2a2b2d", rough=0.6),
    "stone": material("stone", "#d9d0c1", rough=0.85, bump=0.06, bump_scale=12),
    "tile": material("tile", "#2f9aa8", rough=0.2),
    "water": material("water", "#cfe9ec", rough=0.02, transmission=1.0, ior=1.33, bump=0.15, bump_scale=3),
    "lake": material("lake", "#1c3440", rough=0.03, bump=0.25, bump_scale=1.2),
    "lawn": material("lawn", "#4f6a35", rough=0.95, bump=0.3, bump_scale=80),
    "leaf": material("leaf", "#26402c", rough=0.9),
    "bark": material("bark", "#3b2a1d", rough=1.0),
    "lamp": material("lamp", "#202020", emit="#ffd49a"),
    "pendant": material("pendant", "#202020", emit="#ffcf8f"),
    "curtain": material("curtain", "#3a3530", rough=0.9, emit="#ffc98a"),
}
color_variation(M["lawn"], "#2c3d1c", "#4a5a2a", 0.35)
color_variation(M["leaf"], "#0e1b12", "#203424", 1.5)
color_variation(M["stone"], "#a39887", "#b7ad9c", 2.0)

HAZE = []


def add_haze(m, near, far, amount):
    """Aerial perspective: blend toward a haze colour with camera distance."""
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    bsdf_link = out.inputs["Surface"].links[0]
    src = bsdf_link.from_socket
    cam_ = nt.nodes.new("ShaderNodeCameraData")
    mr_ = nt.nodes.new("ShaderNodeMapRange")
    mr_.inputs["From Min"].default_value = near
    mr_.inputs["From Max"].default_value = far
    mr_.inputs["To Max"].default_value = amount
    em = nt.nodes.new("ShaderNodeEmission")
    mx = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(cam_.outputs["View Distance"], mr_.inputs["Value"])
    nt.links.new(mr_.outputs["Result"], mx.inputs[0])
    nt.links.new(src, mx.inputs[1])
    nt.links.new(em.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs["Surface"])
    HAZE.append(em)


# terrain: flat site, hills behind (+Y), drop to lake (-Y)
def terrain(name, size, res, height_fn, mat, center=(0, 0)):
    """Grid centred at `center`; height_fn gets world x/y."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=res, y_subdivisions=res, size=size, location=(center[0], center[1], 0))
    o = bpy.context.object
    o.name = name
    for v in o.data.vertices:
        v.co.z = height_fn(v.co.x + center[0], v.co.y + center[1])
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def site_h(x, y):
    base = 0.0
    if y < -18:  # natural slope down into the lake
        k = min((-18 - y) / 14, 1.0)
        base = -3.6 * (k * k * (3 - 2 * k))
    if y > 20:
        k = (y - 20) / 60
        base = (k ** 1.6) * 22 + noise.noise(Vector((x / 40, y / 40, 1))) * 6 * min(k, 1)
    return base + noise.noise(Vector((x / 15, y / 15, 3))) * 0.15


terrain("site", 300, 240, site_h, M["lawn"], (0, 50))

mtn = material("mountain", "#4a5a58", rough=0.95)
nt = mtn.node_tree
geo = nt.nodes.new("ShaderNodeNewGeometry")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = 20
mr.inputs["From Max"].default_value = 160
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = srgb("#22382a")
ramp.color_ramp.elements[1].position = 0.75
ramp.color_ramp.elements[1].color = srgb("#7d7f78")
nt.links.new(geo.outputs["Position"], sep.inputs[0])
nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])


add_haze(mtn, 150, 1400, 0.85)
add_haze(M["leaf"], 80, 700, 0.55)
add_haze(M["lawn"], 60, 400, 0.6)
add_haze(M["bark"], 80, 700, 0.55)


def ridge(x, y, amp, sc_):
    v = noise.ridged_multi_fractal(Vector((x / sc_, y / sc_, 0.5)), 1.0, 2.0, 6, 1.0, 2.0)
    return max(v, 0) * amp


def ramp01(v):
    v = min(max(v, 0.0), 1.0)
    return v * v * (3 - 2 * v)


terrain("mountains_back", 1500, 260,
        lambda x, y: ridge(x, y, 150, 260) * ramp01((y - 230) / 260) - 4, mtn, (0, 980))
terrain("mountains_across", 1600, 260,
        lambda x, y: ridge(x + 900, y, 170, 300) * ramp01((-420 - y) / 260) - 7, mtn, (0, -1220))

bpy.ops.mesh.primitive_plane_add(size=3000, location=(0, -900, -2.2))
bpy.context.object.data.materials.append(M["lake"])

# trees (linked duplicates of 3 variants)
def make_tree(name, h):
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.22, depth=h * 0.3, location=(0, 0, h * 0.15))
    parts.append(bpy.context.object)
    parts[-1].data.materials.append(M["bark"])
    tiers = 16
    for i in range(tiers):
        z = h * (0.2 + 0.78 * i / tiers)
        r = (h * 0.21 * (1 - i / tiers) ** 0.85 + 0.15) * random.uniform(0.85, 1.15)
        bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=r, depth=h * 0.3, location=(random.uniform(-.1, .1), random.uniform(-.1, .1), z + h * 0.1))
        c = bpy.context.object
        c.rotation_euler = (random.uniform(-.08, .08), random.uniform(-.08, .08), random.random() * 3)
        c.data.materials.append(M["leaf"])
        md = c.modifiers.new("d", "DISPLACE")
        tex = bpy.data.textures.new(f"t{name}{i}", "CLOUDS")
        tex.noise_scale = 0.45
        md.texture = tex
        md.strength = 0.9
        parts.append(c)
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    t = bpy.context.object
    t.name = name
    t.location = (0, 0, -100)
    return t


variants = [make_tree(f"tree{i}", h) for i, h in enumerate((11, 14, 17))]
spots = []
for _ in range(650):
    x = random.uniform(-150, 150)
    y = random.uniform(24, 170)
    if abs(x) < 26 and y < 34:
        continue
    spots.append((x, y))
for x, y in [(-30, 4), (-36, -10), (-27, 14), (31, 8), (37, -6), (29, 18), (-44, 2), (45, 10)]:
    spots.append((x, y))
coll = bpy.context.scene.collection
for x, y in spots:
    src = random.choice(variants)
    o = bpy.data.objects.new("t", src.data)
    o.location = (x, y, site_h(x, y) - 0.2)
    s = random.uniform(0.75, 1.25)
    o.scale = (s, s, s * random.uniform(0.9, 1.15))
    o.rotation_euler.z = random.random() * 6.28
    coll.objects.link(o)

# villa: front faces -Y (lake). Origin at house center.
box("plinth", (24, 15, 0.5), (0, -3.5, 0.25), M["stone"], 0.03)
box("gf_back", (16, 0.4, 3.4), (-1, 2.8, 2.2), M["plaster"])
box("gf_side", (0.4, 10, 3.4), (-9.0, -2, 2.2), M["plaster"])
box("gf_side2", (0.4, 10, 3.4), (7.0, -2, 2.2), M["plaster"])
box("gf_slab", (17, 11, 0.4), (-1, -2, 4.1), M["concrete"], 0.03)
box("gf_floor", (16, 10, 0.1), (-1, -2, 0.55), M["floor"], 0)
box("gf_glass", (15.6, 0.04, 3.0), (-1, -7.0, 2.1), M["glass"], 0)
for x in [-8.6 + i * 2.6 for i in range(7)]:
    box("mull", (0.07, 0.12, 3.1), (x, -7.0, 2.1), M["frame"], 0)
# interior furniture
box("sofa", (4.2, 1.0, 0.75), (-4.5, -2.5, 0.95), M["sofa"])
box("sofa_b", (4.2, 0.3, 0.6), (-4.5, -2.0, 1.5), M["sofa"])
box("table", (2.4, 1.0, 0.08), (2.5, -3.5, 1.35), M["oak"])
box("island", (3.0, 1.0, 0.95), (3.5, 0.8, 1.05), M["dark"])
for x in (1.4, 2.5, 3.6):
    box("pendant", (0.35, 0.35, 0.18), (x, -3.5, 3.0), M["pendant"], 0.03)
box("art", (2.2, 0.05, 1.4), (-4.5, 2.55, 2.4), M["oak"], 0)
# upper floor (cantilever toward lake and +X)
box("uf", (22, 9, 3.2), (3, -1.0, 5.9), M["oak"], 0.03)
box("uf_glass", (20.6, 0.04, 2.2), (3, -5.66, 5.9), M["glass"], 0)
box("uf_cut", (20.4, 0.06, 2.1), (3, -5.56, 5.9), M["curtain"], 0)
for x in [-7.2 + i * 3.4 for i in range(7)]:
    box("mull2", (0.07, 0.12, 2.3), (x, -5.66, 5.9), M["frame"], 0)
box("roof", (22.8, 9.8, 0.3), (3, -1.0, 7.65), M["frame"], 0.02)
box("garage", (7, 7, 3.2), (-14, 1.5, 2.1), M["concrete"], 0.03)
# pool and terrace
box("pool_deck", (17, 8, 0.25), (3, -11.2, 0.6), M["stone"], 0.02)
box("pool_basin", (15, 4.4, 0.05), (3.4, -11.6, 0.51), M["tile"], 0)
box("pool_water", (15, 4.4, 0.2), (3.4, -11.6, 0.63), M["water"], 0)
box("pool_rim", (15.4, 0.25, 0.2), (3.4, -9.3, 0.8), M["stone"], 0.02)
box("pool_rim2", (0.25, 4.6, 0.2), (-4.2, -11.6, 0.8), M["stone"], 0.02)
for i in range(3):
    box("lounger", (0.85, 2.0, 0.3), (-6.8 + i * 1.3, -10.5, 0.9), M["sofa"], 0.08)
# cut a basin into the deck: hide deck where water is by placing water slightly above deck
bpy.data.objects["pool_deck"].modifiers.new("hole", "BOOLEAN").object = bpy.data.objects["pool_water"]
bpy.data.objects["pool_deck"].modifiers["hole"].operation = "DIFFERENCE"
lamps = []
for i in range(5):
    lamps.append(box("bollard", (0.12, 0.12, 0.6), (-17 + i * 2.6, -9 + i * 0.2, 0.3), M["lamp"], 0.01))

# lights for evening (scaled by night factor per frame)
night_lights = [
    area_light((-4, -2, 3.9), (6, 4), 900),
    area_light((3.5, -2, 3.9), (6, 4), 900),
    area_light((3, -1.5, 7.3), (18, 6), 1400),
]
bpy.ops.object.light_add(type="POINT", location=(3.4, -11.6, 0.25))
pool_light = bpy.context.object
pool_light.data.color = srgb("#3fe0f0")[:3]
pool_light.data.shadow_soft_size = 0.3
pool_light["max"] = 900
night_lights.append(pool_light)

# camera path (house front faces -Y)
bpy.ops.object.camera_add()
cam = bpy.context.object
sc.camera = cam
cam.data.lens = 32
cam.data.clip_end = 4000

V = Vector
KEYS = [  # position, target, night
    (V((24, -58, -1.0)), V((0, -3, 3.4)), 0.0),
    (V((26, -24, 7.5)), V((5, -3, 5.6)), 0.05),
    (V((-14, -26, 2.6)), V((3, -9, 1.4)), 0.25),
    (V((4, -64, 1.5)), V((1, -2, 3.5)), 1.0),
    (V((-46, -40, 24)), V((0, -2, 2)), 1.0),
]


def catmull(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def sample(u):
    n = len(KEYS) - 1
    x = min(max(u, 0), 1) * n
    i = min(int(x), n - 1)
    f = x - i
    idx = [max(i - 1, 0), i, i + 1, min(i + 2, n)]
    pos = catmull(*[KEYS[j][0] for j in idx], f)
    tgt = catmull(*[KEYS[j][1] for j in idx], f)
    night = KEYS[i][2] + (KEYS[i + 1][2] - KEYS[i][2]) * f
    return pos, tgt, night


def setup_frame(u):
    pos, tgt, night = sample(u)
    n = night * night * (3 - 2 * night)
    cam.location = pos
    cam.rotation_euler = (tgt - pos).to_track_quat("-Z", "Y").to_euler()
    sky.sun_elevation = math.radians(7 - 9 * n)
    sky.sun_intensity = max(1.0 - n * 1.05, 0.0)
    mix.inputs[0].default_value = 0.6 * n
    sc.view_settings.exposure = 0.9 * n
    for l in night_lights:
        l.data.energy = l["max"] * n
    day_h, night_h = Vector(srgb("#d6c3ab")[:3]), Vector(srgb("#0c1424")[:3])
    hc = day_h.lerp(night_h, n)
    for em in HAZE:
        em.inputs["Color"].default_value = (*hc, 1)
        em.inputs["Strength"].default_value = 1.0 - 0.7 * n
    M["pendant"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 25 * n
    M["curtain"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 2.2 * n
    M["lamp"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 30 * max(0.0, n - 0.5) * 2


def render(path):
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


if MODE == "test":
    u = float(sys.argv[3])
    sc.render.resolution_x, sc.render.resolution_y = 960, 540
    sc.cycles.samples = 40
    setup_frame(u)
    render(f"{OUT}/test_{u:.2f}.png")
else:
    n = int(sys.argv[3])
    w = int(sys.argv[4]) if len(sys.argv) > 4 else 1280
    h = int(sys.argv[5]) if len(sys.argv) > 5 else 720
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.cycles.samples = 32
    import os
    for i in range(n):
        path = f"{OUT}/f_{i:03d}.png"
        if os.path.exists(path):
            continue
        setup_frame(i / (n - 1))
        render(path)
