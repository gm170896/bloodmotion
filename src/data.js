// ============ EDIT ME: all site content lives here ============
export const links = {
  whatsapp: "https://wa.me/6285157122939",
  instagram: "https://www.instagram.com/hudan.a_",
  lynk: "https://www.lynk.id/hudan.a_",
  fiverr: "https://www.fiverr.com/hudanaminulloh",
  email: "blood.motion24@gmail.com",
};

// PORTFOLIO: one entry per project. `service` MUST equal a service title below (this groups the work by service).
// image = thumbnail shown when idle. video = SHORT silent preview clip (mp4/webm, 5-10 s, 720p, ideally under 4 MB)
// that plays on hover (desktop) / tap (phone); only one plays at a time. Replace the sample clip or set video: "" to disable.
// Layanan "Metal Logo" memakai GAMBAR saja (image: "/assets/nama-logo.png", video: ""). Layanan lain boleh pakai video preview.
// link (YouTube/IG/etc, optional) = full video, shown as a "Watch full" button. Newest first = put it at the top.
// image: "/assets/your-file.jpg" (put files in /public/assets). Leave "" to show the placeholder tile.
export const projects = [
  { title: "PARANORMAL", service: "Music Visual", year: "2026", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "LIVE IN MOTION", service: "Live Visual", year: "2026", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "NOISE CULTURE", service: "Motion Graphics", year: "2025", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "AFTER DARK", service: "Music Visual", year: "2025", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "SAMPLE EDIT", service: "Video Editing", year: "2026", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "SAMPLE CONTENT", service: "Creative Content", year: "2025", image: "", video: "/assets/sample-preview.mp4", link: "", description: "Placeholder. Replace with the real project description." },
  { title: "SAMPLE LOGO", service: "Metal Logo", year: "2026", image: "/assets/sample-logo.png", video: "", link: "", description: "Placeholder. Replace with the real project description." },
];

// DRAFT services. Sync names with your Lynk / Fiverr listings (one entry per service, no duplicates).
export const services = [
  { title: "Video Editing", desc: "Music videos, social media content, promotional videos, documentaries, event recaps, and creative edits.",
    items: ["Music video & lyric video", "Reels / TikTok / Shorts edit", "Promo & event recap", "Documentary & creative edit", "Color grading & sound sync"] },
  { title: "Motion Graphics", desc: "Typography animation, visual effects, title sequences, promotional graphics, and animated branding.",
    items: ["Kinetic typography", "Title sequence & intro/outro", "Animated logo & branding", "VFX & compositing", "Promo graphics"] },
  { title: "Music Visual", desc: "Visual content designed specifically for musicians, bands, releases, albums, singles, and music campaigns.",
    items: ["Visualizer & lyric visual", "Single / album release visuals", "Looping canvas for streaming", "Teaser & campaign cuts"] },
  { title: "Live Visual", desc: "VJ content, concert visuals, stage visuals, LED screen content, and live performance visuals.",
    items: ["VJ content pack", "Concert & stage visuals", "LED screen content", "Show opener & loops"] },
  { title: "Creative Content", desc: "Social media campaigns, digital content, promotional visuals, and experimental creative work.",
    items: ["Social media campaign visuals", "Promo content series", "Experimental concept pieces"] },
  { title: "Metal Logo", isNew: true, desc: "Custom metal-style logo and lettering for bands, labels, and brands. Sharp, intense, and made to be remembered.",
    items: ["Band / label / brand logo", "Metal lettering styles", "Vector + transparent PNG files", "Logo animation add-on"] },
];

export const steps = [
  ["Brief","Understand the idea, music, audience, and objective.","We listen first: the track, the room, the people watching."],
  ["Concept","Develop the visual direction, references, mood, and creative approach.","Moodboards, references and a clear look before any frame is cut."],
  ["Production","Editing, motion design, compositing, animation, and visual production.","The heavy lifting. Rhythm, texture, timing, all built to the sound."],
  ["Delivery","Final mastering, revisions, optimization, and delivery for the required platform.","Exported and checked for the screen it will live on."],
];

// Add real bands / brands to `names` (e.g. names: ["Band A", "Brand B"]).
export const clients = [
  { group: "Music Artists", names: [] },
  { group: "Creative Brands", names: [] },
  { group: "Event Organizers", names: [] },
  { group: "Communities", names: [] },
  { group: "Independent Labels", names: [] },
];

// Team: put photos in /public/assets/team/ and set photo: "/assets/team/name.jpg". CHANGE names & roles.
export const team = [
  { name: "Hudan A.", role: "Founder / Editor & Motion", photo: "" },
  { name: "Team Member 2", role: "Role", photo: "" },
  { name: "Team Member 3", role: "Role", photo: "" },
];

// Logo client untuk section CLIENTS (setelah Our Team). logo = "/assets/clients/nama.png" (PNG transparan, putih/terang).
// Kosongkan logo untuk menampilkan nama sebagai teks. Ganti nama placeholder dengan client asli.
export const clientLogos = [
  { name: "Client Name 1", logo: "" },
  { name: "Client Name 2", logo: "" },
  { name: "Client Name 3", logo: "" },
  { name: "Client Name 4", logo: "" },
  { name: "Client Name 5", logo: "" },
  { name: "Client Name 6", logo: "" },
];

// Pilihan budget di form "Start a project" (ubah sesuai harga kamu).
export const budgets = ["Not decided yet", "Under $100", "$100-$300", "$300-$600", "$600+"];

// Kategori Selected Work (urutan = urutan tombol filter). `service` di setiap project harus sama persis dengan salah satu nama ini.
// Kalau memakai Sanity, kategori & project dikelola di admin (Selected Work > Categories / Projects) dan menggantikan daftar ini.
export const workCategories = ["Video Editing", "Motion Graphics", "Music Visual", "Live Visual", "Creative Content", "Metal Logo"];

// Teks section (semua bisa diedit lewat admin). Ini hanya nilai awal / cadangan kalau backend belum jalan.
export const nav = [
  { label: "Work", id: "work" }, { label: "Services", id: "services" }, { label: "Process", id: "process" },
  { label: "About", id: "about" }, { label: "Our Team", id: "team" }, { label: "Clients", id: "clients" }, { label: "Contact", id: "contact" },
];
export const site = {
  brand: "BLOOD MOTION",
  hero: {
    topLeft: "Independent creative studio", topRight: "Indonesia", slogan: "Sick Motion - No Mercy !",
    tag: "VISUALS WITH ATTITUDE.",
    desc: "Independent creative studio from Indonesia working across video, motion, music, live visuals, and digital culture.",
    ctaPrimary: "View selected work", ctaSecondary: "Start a project", marquee: "SICK MOTION, NO MERCY!",
  },
  intro: {
    title: "WE MAKE VISUALS MOVE.",
    p1: "Blood Motion is a creative studio from Indonesia focused on visual storytelling, video editing, motion graphics, music visuals, live visuals, and digital content.",
    p2: "We work with musicians, brands, events, creative communities, and people who want their ideas to look different.",
  },
  work: { title: "SELECTED WORK", sub: "Grouped by service" },
  services: { title: "WHAT WE DO" },
  process: { title: "THE PROCESS" },
  statement: { line1: "NOT JUST CONTENT.", line2: "WE CREATE VISUAL IDENTITY." },
  about: {
    title: "ABOUT BLOOD MOTION",
    p1: "Blood Motion is an independent creative studio from Indonesia exploring the space between music, motion, video, and visual culture.",
    p2: "From editing a music video to creating visuals for a live stage, we turn ideas, sound, and energy into visual experiences.",
  },
  team: { title: "OUR TEAM" },
  clients: { title: "CLIENTS & COLLABORATORS", sub: "A selection of artists, labels and brands we have worked with." },
  contact: { title: "HAVE SOMETHING IN MIND?", lead: "LET'S MAKE IT MOVE.", ctaPrimary: "Start a project", ctaSecondary: "View portfolio" },
  footer: { place: "Indonesia", tag: "VISUALS WITH ATTITUDE.", copyright: "© BLOOD MOTION 2026" },
  order: {
    title: "START A PROJECT",
    sub: "Send us your track, artwork, and release date. We'll reply with a visual direction and a quote that fits.",
    note: "Your details are only used to respond to this inquiry. Sent via WhatsApp or email.",
  },
  // Gambar situs (header logo, hero logo, about logo). Kosong = pakai file default di /assets.
  images: { logo: "", heroLogo: "", aboutLogo: "" },
};
