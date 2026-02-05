/**
 * SUSFS WebUI - Material 3 Compatible i18n
 * Adapted from original logic
 */

let availableLanguages = { en: "English" };
let currentLang = localStorage.getItem("susfs_language") || "en";
let currentXml = null;
let fallbackXml = null;

async function loadAvailableLanguages() {
    try {
        const res = await fetch("/languages/languages.json");
        if (res.ok) {
            availableLanguages = await res.json();
            console.log("Available languages loaded:", availableLanguages);
        } else {
            console.error("Could not load languages.json, using defaults");
        }
    } catch (e) {
        console.error("Error loading languages.json:", e);
    }
}

async function fetchLanguageXml(langCode) {
    try {
        const res = await fetch(`/languages/${langCode}.xml`);
        const text = await res.text();
        return new DOMParser().parseFromString(text, "text/xml");
    } catch (e) {
        console.error(`Failed to load language ${langCode}:`, e);
        // Fallback To English
        if (langCode !== "en") {
            return fetchLanguageXml("en");
        }
        return null;
    }
}

// Helper
function getTranslation(id) {
    if (!currentXml) return id;

    const strings = currentXml.getElementsByTagName("string");
    for (let i = 0; i < strings.length; i++) {
        if (strings[i].getAttribute("id") === id) {
            const text = strings[i].textContent;
            if (text && text.trim() !== "") return text;
            break;
        }
    }

    // Fallback to English XML If Empty
    if (fallbackXml && currentLang !== "en") {
        const fbStrings = fallbackXml.getElementsByTagName("string");
        for (let j = 0; j < fbStrings.length; j++) {
            if (fbStrings[j].getAttribute("id") === id) {
                return fbStrings[j].textContent || id;
            }
        }
    }
    return id;
}

// Apply To All DOM
function applyTranslations(xmlDoc) {
    if (!xmlDoc) return;
    currentXml = xmlDoc;

    const strings = xmlDoc.getElementsByTagName("string");
    
    for (let i = 0; i < strings.length; i++) {
        const id = strings[i].getAttribute("id");
        const text = strings[i].textContent;

        // Update
        document.querySelectorAll(`[data-i18n="${id}"]`).forEach(el => {
            el.textContent = text;
        });

        // Material 3 Desain
        document.querySelectorAll(`[data-i18n-label="${id}"]`).forEach(el => {
            if ('label' in el) {
                el.label = text;
            } else {
                // Fallback for input standar
                el.setAttribute("label", text); 
                el.setAttribute("placeholder", text);
            }
        });
    }
}

// Change Language
async function switchLanguage(langCode) {
    if (!availableLanguages[langCode]) {
        console.error(`Language ${langCode} not supported`);
        return;
    }

    const xmlDoc = await fetchLanguageXml(langCode);
    if (xmlDoc) {
        applyTranslations(xmlDoc);
        localStorage.setItem("susfs_language", langCode);
        currentLang = langCode;

        // Update nilai visual dropdown MD3
        const selectEl = document.getElementById("language");
        if (selectEl) {
            selectEl.value = langCode;
            selectEl.dispatchEvent(new Event('change')); 
        }
    }
}

function renderLanguageSelector() {
    const selectEl = document.getElementById("language");
    if (!selectEl) return;

    // Bersihkan opsi lama
    selectEl.innerHTML = '';

    for (const [code, name] of Object.entries(availableLanguages)) {
        // GUNAKAN md-select-option, BUKAN option biasa
        const option = document.createElement("md-select-option");
        option.value = code;

        // Struktur slot headline untuk MD3
        const headline = document.createElement("div");
        headline.slot = "headline";
        headline.textContent = name;
        
        option.appendChild(headline);

        if (code === currentLang) {
            option.selected = true;
        }

        selectEl.appendChild(option);
    }

    // Event Listener
    const newSelectEl = selectEl.cloneNode(true);
    selectEl.parentNode.replaceChild(newSelectEl, selectEl);
    
    newSelectEl.addEventListener("change", (e) => {
        // MD3 select value ada di target.value
        switchLanguage(e.target.value);
    });
    
}

// 7. Inisialisasi Utama
async function init() {
    await loadAvailableLanguages();
    fallbackXml = await fetchLanguageXml("en"); // Selalu load English sebagai cadangan
    renderLanguageSelector(); // Render dropdown MD3
    await switchLanguage(currentLang); // Load bahasa tersimpan
}

async function applyTranslationsToNewContent(container) {
    const xmlDoc = await fetchLanguageXml(currentLang);
    if (!xmlDoc) return;

    const strings = xmlDoc.getElementsByTagName("string");
    for (let i = 0; i < strings.length; i++) {
        const id = strings[i].getAttribute("id");
        const text = strings[i].textContent;
        
        // Update textContent
        container.querySelectorAll(`[data-i18n="${id}"]`).forEach(el => {
            el.textContent = text;
        });
        
        // Update labels
        container.querySelectorAll(`[data-i18n-label="${id}"]`).forEach(el => {
            if('label' in el) el.label = text;
        });
    }

    if (container.querySelector("#language")) {
        renderLanguageSelector();
    }
}

window.i18n = {
    init: init,
    switchLanguage: switchLanguage,
    getCurrentLanguage: () => currentLang,
    getTranslation: getTranslation,
    applyTranslationsToNewContent: applyTranslationsToNewContent
};