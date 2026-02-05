/**
 * SUSFS WebUI - Credits Logic (Material 3 Version)
 * Replaces original minified creditsjs logic.
 */

// --- 1. Assets (Avatar Images) ---
const imgBlue = "/assets/blue-CDd1JgFA.png";
const imgBrown = "/assets/brown-DkMF-zd4.png";
const imgCyan = "/assets/cyan-CxxU9VUc.png";
const imgOrange = "/assets/orange-Dz5Wr5v6.png";
const imgYellow = "/assets/yellow-CMDT5nHw.png";
const imgGreen = "/assets/green-BwBzMX7_.png";
const imgLime = "/assets/lime-DPDNUj7v.png";
const imgPink = "/assets/pink-BsJVk9ad.png";
const imgPurple = "/assets/purple-b3Qaozit.png";
const imgRed = "/assets/red-DsgSinuJ.png";
const imgWhite = "/assets/white-BOZMyur9.png";
const imgBlack = "/assets/black-CWwxUpmx.png";

// Mapping index karakter ke gambar (Sesuai urutan array asli 'n')
const avatars = [
    imgBlue,   // 0
    imgBrown,  // 1
    imgCyan,   // 2
    imgOrange, // 3
    imgYellow, // 4
    imgGreen,  // 5
    imgLime,   // 6
    imgPink,   // 7
    imgPurple, // 8
    imgRed,    // 9
    imgWhite,  // 10
    imgBlack   // 11
];

// --- 2. HTML Generators (MD3 Style) ---

// GitHub Icon SVG Path
const githubSvgPath = "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z";

// Generator untuk Translator (sebelumnya fungsi 'u')
function generateTranslatorHtml({ name, country, character, github }) {
    return `
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--md-sys-color-surface-container);
        border-radius: 16px;
        padding: 16px;
        min-width: 130px;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: background 0.2s;
    ">
        <img src="${avatars[character]}" style="width: 60px; height: 75px; object-fit: contain; margin-bottom: 8px;">
        
        <h3 style="margin: 0; color: var(--md-sys-color-on-surface); font-size: 1rem; font-weight: 500;">${name}</h3>
        <p style="margin: 4px 0 12px 0; color: var(--md-sys-color-secondary); font-size: 0.85rem;">${country}</p>
        
        <md-icon-button onclick="ksu.exec(\`am start -a android.intent.action.VIEW -d ${github}\`)" style="--md-icon-button-icon-size: 20px;">
             <svg viewBox="0 0 496 512" style="width: 20px; height: 20px; fill: currentColor;">
                <path d="${githubSvgPath}"></path>
             </svg>
        </md-icon-button>
    </div>
    `;
}

// Generator untuk Contributor (sebelumnya fungsi 'f')
function generateContributorHtml({ name, character, github }) {
    return `
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--md-sys-color-surface-container);
        border-radius: 16px;
        padding: 16px;
        min-width: 130px;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">
        <img src="${avatars[character]}" style="width: 60px; height: 75px; object-fit: contain; margin-bottom: 8px;">
        
        <h3 style="margin: 0 0 12px 0; color: var(--md-sys-color-on-surface); font-size: 1rem; font-weight: 500;">${name}</h3>
        
        <md-icon-button onclick="ksu.exec(\`am start -a android.intent.action.VIEW -d ${github}\`)" style="--md-icon-button-icon-size: 20px;">
             <svg viewBox="0 0 496 512" style="width: 20px; height: 20px; fill: currentColor;">
                <path d="${githubSvgPath}"></path>
             </svg>
        </md-icon-button>
    </div>
    `;
}

// --- 3. Fetching Logic ---

// Fetch Translators (sebelumnya fungsi 'y')
function fetchTranslators() {
    fetch("/translators.json")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("translators-container");
            if (container) {
                // Bersihkan kontainer jika perlu, atau append
                // container.innerHTML = ''; 
                data.forEach(item => {
                    container.innerHTML += generateTranslatorHtml(item);
                });
            }
        });
}

// Fetch Contributors (sebelumnya fungsi 'v')
function fetchContributors() {
    fetch("/contributors.json")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("contributors-container");
            if (container) {
                // Bersihkan kontainer jika perlu
                // container.innerHTML = ''; 
                data.forEach(item => {
                    container.innerHTML += generateContributorHtml(item);
                });
            }
        });
}

// --- 4. Exports (Must match original aliases for compatibility) ---
// r as a, c as b, ... etc.
// Important: 'y as f' (fetchTranslators exported as f)
// Important: 'v as s' (fetchContributors exported as s)

export {
    imgBlue as a,          // c -> a
    imgBrown as b,         // r -> b
    imgCyan as c,          // o -> c
    generateTranslatorHtml as d, // h -> d ? No, check original logic 'h' was getTranslation.
    // NOTE: Logika 'h' (getTranslation) tidak ada di snippet asli creditsjs yang Anda berikan di atas.
    // Snippet hanya berisi logic credits. Logic 'h' ada di i18n.js.
    // Saya akan mengekspor sesuai struktur yang relevan untuk file credits ini.
    
    // Original Export structure analysis from your snippet:
    // export{r as a, c as b, o as c, h as d, w as e, y as f, g, p as l, i as o, d as p, x as r, v as s, m as w, l as y};
    
    // Assets mapping from original `n` array order:
    // c=blue, r=brown, o=cyan, i=orange, l=yellow, g=green, p=lime, d=pink, h=purple, x=red, m=white, w=black
    
    // Correct Alias Mapping based on original snippet:
    imgBrown as a, // r -> a (Original: export {r as a}) - WAIT, r is brown.
    imgBlue as b,  // c -> b
    imgCyan as c,  // o -> c
    imgPurple as d, // h -> d
    imgBlack as e,  // w -> e
    fetchTranslators as f, // y -> f (PENTING: Ini yang dipanggil index.js)
    imgGreen as g,  // g -> g
    imgYellow as y, // l -> y (Original: l as y)
    imgLime as l,   // p -> l
    imgOrange as o, // i -> o
    imgPink as p,   // d -> p
    imgRed as r,    // x -> r
    fetchContributors as s, // v -> s (PENTING: Ini yang dipanggil index.js)
    imgWhite as w   // m -> w
};