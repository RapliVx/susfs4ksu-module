let l = { en: "English" },
    o = localStorage.getItem("susfs_language") || "en",
    i = null,
    c = null;

async function x() {
    try {
        const t = await fetch("/languages/languages.json");
        t.ok ? (l = await t.json(), console.log("Available languages loaded:", l)) : console.error("Could not load languages.json, using defaults")
    } catch (t) {
        console.error("Error loading languages.json:", t)
    }
}

async function g(t) {
    try {
        const e = await (await fetch(`/languages/${t}.xml`)).text();
        return new DOMParser().parseFromString(e, "text/xml")
    } catch (n) {
        return console.error(`Failed to load language ${t}:`, n), t !== "en" ? g("en") : null
    }
}

function h(t) {
    if (!i) return t;
    const n = i.getElementsByTagName("string");
    for (let e = 0; e < n.length; e++)
        if (n[e].getAttribute("id") === t) {
            const a = n[e].textContent;
            if (a && a.trim() !== "") return a;
            break
        }
    if (c && o !== "en") {
        const e = c.getElementsByTagName("string");
        for (let a = 0; a < e.length; a++)
            if (e[a].getAttribute("id") === t) return e[a].textContent || t
    }
    return t
}

// FUNGSI INI DIPERBAIKI: Menangani Text Content DAN Label MD3
function p(t) {
    if (!t) return;
    i = t;
    const n = t.getElementsByTagName("string");
    for (let e = 0; e < n.length; e++) {
        const a = n[e].getAttribute("id"),
              s = n[e].textContent;
        
        document.querySelectorAll(`[data-i18n="${a}"]`).forEach(f => {
            // Cek jika elemen adalah Input MD3 atau Label MD3, gunakan properti .label
            // Jika elemen biasa, gunakan .textContent
            if (f.tagName.includes('MD-') && 'label' in f) {
                f.label = s;
                // Opsional: set placeholder juga jika perlu
                if('placeholder' in f) f.placeholder = s;
            } else {
                f.textContent = s;
            }
        })
    }
}

async function r(t) {
    if (!l[t]) {
        console.error(`Language ${t} not supported`);
        return
    }
    const n = await g(t);
    if (n) {
        p(n), localStorage.setItem("susfs_language", t), o = t;
        const e = document.getElementById("language");
        // MD3 menggunakan .value seperti biasa, tapi kita pastikan trigger change visual
        e && (e.value = t) 
    }
}

async function w() {
    await x(), c = await g("en"), d(), await r(o)
}

async function y() {
    const t = document.getElementById("language");
    await r(o), t.addEventListener("change", n => {
        r(n.target.value)
    })
}

// FUNGSI INI DIPERBAIKI: Membuat <md-select-option> bukan <option>
function d() {
    const t = document.getElementById("language");
    if(!t) return;
    
    // Bersihkan opsi lama agar tidak duplikat
    t.innerHTML = "";

    // Tambahkan kembali Icon (opsional, agar tidak hilang saat reset)
    const icon = document.createElement("md-icon");
    icon.slot = "leading-icon";
    icon.textContent = "language";
    t.appendChild(icon);

    for (const [n, e] of Object.entries(l)) {
        // GANTI: Buat md-select-option
        const a = document.createElement("md-select-option");
        a.value = n;
        
        // GANTI: MD3 butuh teks di dalam slot 'headline'
        const hl = document.createElement("div");
        hl.slot = "headline";
        hl.textContent = e;
        a.appendChild(hl);

        // GANTI: MD3 gunakan properti .selected
        n === o && (a.selected = !0), t.appendChild(a)
    }
    t.addEventListener("change", n => {
        r(n.target.value)
    })
}

// FUNGSI INI DIPERBAIKI: Sama seperti 'p', menangani elemen MD3 dinamis
async function E(t) {
    const n = await g(o);
    if (!n) return;
    const e = n.getElementsByTagName("string");
    for (let a = 0; a < e.length; a++) {
        const s = e[a].getAttribute("id"),
              u = e[a].textContent;
        
        t.querySelectorAll(`[data-i18n="${s}"]`).forEach(m => {
            if (m.tagName.includes('MD-') && 'label' in m) {
                m.label = u;
            } else {
                m.textContent = u;
            }
        })
    }
    t.querySelector("#language") || d(), y()
}

window.i18n = {
    init: w,
    switchLanguage: r,
    getCurrentLanguage: () => o,
    getTranslation: h,
    applyTranslationsToNewContent: E
};