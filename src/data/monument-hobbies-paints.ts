/**
 * Catalogue des peintures Pro Acryl (Monument Hobbies).
 * Hex approximés d'après les noms de couleur.
 */

import type { Paint, PaintRange } from "./paint-types";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function p(name: string, hex: string, type: string, metallic?: boolean): Paint {
  return { id: slug(name), name, hex, type, ...(metallic && { metallic }) };
}

export const MONUMENT_HOBBIES_PAINTS: Paint[] = [
  // ── Core Pro Acryl (001-075) ────────────────────────────
  p("Titanium White", "#F5F5F0", "Standard"),
  p("Ivory", "#FFFFF0", "Standard"),
  p("Warm White", "#FAF0E6", "Standard"),
  p("Cool White", "#E8EDF0", "Standard"),
  p("Yellow", "#FFD700", "Standard"),
  p("Golden Yellow", "#FFC107", "Standard"),
  p("Orange", "#FF8C00", "Standard"),
  p("Bright Orange", "#FF6600", "Standard"),
  p("Red", "#CC0000", "Standard"),
  p("Bright Red", "#EE0000", "Standard"),
  p("Dark Red", "#8B0000", "Standard"),
  p("Magenta", "#CC0066", "Standard"),
  p("Pink", "#FF69B4", "Standard"),
  p("Pale Rose", "#FFB6C1", "Standard"),
  p("Violet", "#7B2D8E", "Standard"),
  p("Purple", "#6A0DAD", "Standard"),
  p("Dark Violet", "#4B0082", "Standard"),
  p("Ultramarine Blue", "#1E3F8B", "Standard"),
  p("Blue", "#2563EB", "Standard"),
  p("Bright Blue", "#0077CC", "Standard"),
  p("Dark Blue", "#001F5C", "Standard"),
  p("Navy", "#000080", "Standard"),
  p("Sky Blue", "#87CEEB", "Standard"),
  p("Turquoise", "#30D5C8", "Standard"),
  p("Teal", "#008080", "Standard"),
  p("Dark Teal", "#004D4D", "Standard"),
  p("Green", "#228B22", "Standard"),
  p("Bright Green", "#00CC44", "Standard"),
  p("Dark Green", "#004D00", "Standard"),
  p("Olive Green", "#556B2F", "Standard"),
  p("Yellow Green", "#9ACD32", "Standard"),
  p("Jade Green", "#00A86B", "Standard"),
  p("Forest Green", "#0B6623", "Standard"),
  p("Brown", "#8B4513", "Standard"),
  p("Dark Brown", "#3B1E08", "Standard"),
  p("Leather Brown", "#7B5B3A", "Standard"),
  p("Tan", "#D2B48C", "Standard"),
  p("Khaki", "#C3B091", "Standard"),
  p("Sand", "#C2B280", "Standard"),
  p("Flesh", "#E8B88A", "Standard"),
  p("Dark Flesh", "#A0694B", "Standard"),
  p("Pale Flesh", "#FFDAB9", "Standard"),
  p("Warm Grey", "#808078", "Standard"),
  p("Neutral Grey", "#808080", "Standard"),
  p("Cool Grey", "#7A8B8B", "Standard"),
  p("Dark Warm Grey", "#504840", "Standard"),
  p("Dark Neutral Grey", "#484848", "Standard"),
  p("Dark Cool Grey", "#3D4A4A", "Standard"),
  p("Coal Black", "#1A1A1A", "Standard"),
  p("Dark Umber", "#2C1608", "Standard"),

  // ── Bold ────────────────────────────────────────────────
  p("Bold Pyrrole Red", "#E62020", "Bold"),
  p("Bold Magenta", "#E0115F", "Bold"),
  p("Bold Bright Orange", "#FF5F15", "Bold"),
  p("Bold Yellow", "#FFE000", "Bold"),
  p("Bold Bright Green", "#00E639", "Bold"),
  p("Bold Blue", "#0055FF", "Bold"),
  p("Bold Cyan", "#00CCFF", "Bold"),
  p("Bold Violet", "#8B00FF", "Bold"),
  p("Bold Titanium White", "#FFFFFF", "Bold"),

  // ── Transparent ─────────────────────────────────────────
  p("Transparent Red", "#CC000088", "Transparent"),
  p("Transparent Blue", "#0044CC88", "Transparent"),
  p("Transparent Yellow", "#FFD70088", "Transparent"),
  p("Transparent Green", "#00880088", "Transparent"),
  p("Transparent Magenta", "#CC006688", "Transparent"),
  p("Transparent Orange", "#FF660088", "Transparent"),
  p("Transparent Violet", "#6A0DAD88", "Transparent"),

  // ── Metallic ────────────────────────────────────────────
  p("Rich Gold", "#CFB53B", "Metallic", true),
  p("Pale Gold", "#EEE8AA", "Metallic", true),
  p("Rose Gold", "#B76E79", "Metallic", true),
  p("Bronze", "#CD7F32", "Metallic", true),
  p("Copper", "#B87333", "Metallic", true),
  p("Silver", "#C0C0C0", "Metallic", true),
  p("Dark Silver", "#808080", "Metallic", true),
  p("Gunmetal", "#536267", "Metallic", true),

  // ── Signature Series ────────────────────────────────────
  // Vince Venturella
  p("Vince's Warm Black", "#1A1210", "Signature"),
  p("Vince's Warm White", "#F5EDE0", "Signature"),
  p("Vince's Pink", "#E75480", "Signature"),
  p("Vince's Magenta Red", "#CC2244", "Signature"),
  p("Vince's Sanguine Highlight", "#E86850", "Signature"),
  p("Vince's Turquoise", "#40E0D0", "Signature"),
  // Ninjon
  p("Ninjon's Peach", "#FFB07C", "Signature"),
  p("Ninjon's Highlight Peach", "#FFDAB9", "Signature"),
  p("Ninjon's Salmon", "#FA8072", "Signature"),
  p("Ninjon's Bright Purple", "#9B30FF", "Signature"),
  p("Ninjon's Sky Blue", "#87CEFA", "Signature"),
  p("Ninjon's Pastel Green", "#98FB98", "Signature"),
  // Ben Komets
  p("Ben's Moonstone", "#D4D7DC", "Signature"),
  p("Ben's Green Earth", "#4A6741", "Signature"),
  p("Ben's Ochre", "#CC7722", "Signature"),
  p("Ben's Burnt Sienna", "#E97451", "Signature"),
  p("Ben's Raw Umber", "#6B4423", "Signature"),
  p("Ben's Cobalt Blue", "#0047AB", "Signature"),
  // Matt Cexwish
  p("Matt's Bright Magenta", "#FF0090", "Signature"),
  p("Matt's Deep Green", "#003820", "Signature"),
  p("Matt's Rusty Red", "#DA2C38", "Signature"),
  p("Matt's Warm Ochre", "#D4873F", "Signature"),
  // Flameon
  p("Flameon's Coral", "#FF6F61", "Signature"),
  p("Flameon's Teal", "#2E8B8B", "Signature"),
  p("Flameon's Lavender", "#B57EDC", "Signature"),
  p("Flameon's Hot Pink", "#FF1493", "Signature"),
  // Rogue Hobbies
  p("Rogue's Orange Brown", "#A0522D", "Signature"),
  p("Rogue's Red Brown", "#7C2D12", "Signature"),
  p("Rogue's Pale Yellow", "#FAFAD2", "Signature"),
  // Adepticon
  p("Adepticon Blue", "#3A7CA5", "Signature"),
  p("Adepticon Gold", "#DAA520", "Signature", true),

  // ── Fluorescent ─────────────────────────────────────────
  p("Fluorescent Yellow", "#DFFF00", "Fluorescent"),
  p("Fluorescent Green", "#39FF14", "Fluorescent"),
  p("Fluorescent Orange", "#FF5F1F", "Fluorescent"),
  p("Fluorescent Pink", "#FF1493", "Fluorescent"),
  p("Fluorescent Magenta", "#FF00FF", "Fluorescent"),
  p("Fluorescent Blue", "#00F7FF", "Fluorescent"),

  // ── AMP Colors ──────────────────────────────────────────
  p("AMP Dark Flesh", "#6B3A2A", "AMP"),
  p("AMP Warm Flesh", "#C68E6A", "AMP"),
  p("AMP Pale Flesh", "#F5D5B8", "AMP"),
  p("AMP Yellow Ochre", "#CC8800", "AMP"),
  p("AMP Burnt Orange", "#CC5500", "AMP"),
  p("AMP Crimson", "#990033", "AMP"),
  p("AMP Dark Magenta", "#8B008B", "AMP"),
  p("AMP Deep Blue", "#003366", "AMP"),
  p("AMP Bright Blue", "#0088CC", "AMP"),
  p("AMP Phthalo Green", "#006B3C", "AMP"),
  p("AMP Bright Green", "#44BB44", "AMP"),
  p("AMP Grey Green", "#5F7A61", "AMP"),
  p("AMP Dark Earth", "#3B2F1E", "AMP"),
  p("AMP Warm Brown", "#80522D", "AMP"),
  p("AMP Buff", "#DEB887", "AMP"),

  // ── Washes ──────────────────────────────────────────────
  p("Dark Wash", "#1A1008", "Wash"),
  p("Umber Wash", "#4A3728", "Wash"),
  p("Sepia Wash", "#704214", "Wash"),
  p("AMP Dark Wash", "#100A04", "Wash"),
  p("AMP Red Wash", "#6B1010", "Wash"),
  p("AMP Blue Wash", "#0A1A3A", "Wash"),
  p("AMP Green Wash", "#0A2A0A", "Wash"),

  // ── Expert Acrylics (Tri Art) ───────────────────────────
  p("Expert Cadmium Yellow", "#FFF200", "Expert"),
  p("Expert Cadmium Orange", "#ED872D", "Expert"),
  p("Expert Cadmium Red", "#E30022", "Expert"),
  p("Expert Alizarin Crimson", "#E32636", "Expert"),
  p("Expert Quinacridone Magenta", "#A50B5E", "Expert"),
  p("Expert Dioxazine Purple", "#4B0076", "Expert"),
  p("Expert Ultramarine Blue", "#120A8F", "Expert"),
  p("Expert Phthalo Blue", "#000F89", "Expert"),
  p("Expert Cerulean Blue", "#2A52BE", "Expert"),
  p("Expert Phthalo Green BS", "#006B3C", "Expert"),
  p("Expert Phthalo Green YS", "#00A550", "Expert"),
  p("Expert Chromium Oxide Green", "#4C7A4C", "Expert"),
  p("Expert Yellow Oxide", "#E09714", "Expert"),
  p("Expert Red Oxide", "#6D2B15", "Expert"),
  p("Expert Burnt Umber", "#3B2314", "Expert"),
  p("Expert Raw Umber", "#6B5B3C", "Expert"),

  // ── Primers ─────────────────────────────────────────────
  p("White Primer", "#F0F0F0", "Primer"),
  p("Grey Primer", "#808080", "Primer"),
  p("Black Primer", "#1A1A1A", "Primer"),
  p("Bone Primer", "#E3D5B0", "Primer"),
  p("Green Primer", "#2E5A2E", "Primer"),
  p("Blue Primer", "#1A3A5C", "Primer"),
  p("Red Primer", "#8B1A1A", "Primer"),
  p("Brown Primer", "#4A2A12", "Primer"),
  p("Tan Primer", "#C8A882", "Primer"),
  p("Pink Primer", "#D4738A", "Primer"),

  // ── Médiums & Vernis ────────────────────────────────────
  p("Glaze & Wash Medium", "#F0F0F0", "Medium"),
  p("Matte Varnish", "#F0F0F0", "Medium"),
  p("Gloss Varnish", "#F5F5F5", "Medium"),
  p("NEWSH Weathering Medium", "#E8E0D0", "Medium"),
];

/** Types de peinture Monument Hobbies */
export const MH_PAINT_TYPES: string[] = [
  "Standard",
  "Bold",
  "Signature",
  "Fluorescent",
  "AMP",
  "Wash",
  "Transparent",
  "Metallic",
  "Expert",
  "Primer",
  "Medium",
];

/** Couleurs CSS des badges par type */
export const MH_TYPE_COLORS: Record<string, string> = {
  Standard: "bg-blue-500/20 text-blue-400",
  Bold: "bg-orange-500/20 text-orange-400",
  Signature: "bg-purple-500/20 text-purple-400",
  Fluorescent: "bg-lime-500/20 text-lime-400",
  AMP: "bg-rose-500/20 text-rose-400",
  Wash: "bg-amber-500/20 text-amber-400",
  Transparent: "bg-sky-500/20 text-sky-400",
  Metallic: "bg-yellow-500/20 text-yellow-400",
  Expert: "bg-emerald-500/20 text-emerald-400",
  Primer: "bg-slate-500/20 text-slate-400",
  Medium: "bg-neutral-500/20 text-neutral-400",
};

/** Gamme Monument Hobbies Pro Acryl complète */
export const MONUMENT_HOBBIES_RANGE: PaintRange = {
  slug: "monument-hobbies",
  brand: "Monument Hobbies",
  name: "Pro Acryl",
  description: "Peintures Pro Acryl pour figurines et maquettes",
  paints: MONUMENT_HOBBIES_PAINTS,
  paintTypes: MH_PAINT_TYPES,
  typeColors: MH_TYPE_COLORS,
};
