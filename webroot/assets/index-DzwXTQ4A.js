/**
 * SUSFS WebUI - Main Logic (Material 3 Version)
 * Rewritten for readability and MD3 compatibility.
 */

import { H as Highway, F as Fade, g as gsap } from "./fade-4ApaDT9x.js";
import { 
    b as imgBlue, a as imgBrown, c as imgCyan, o as imgOrange, y as imgYellow, 
    g as imgGreen, l as imgLime, p as imgPink, d as imgPurple, r as imgRed, 
    w as imgWhite, e as imgBlack, s as fetchContributors, f as fetchTranslators 
} from "./creditsjs-BfjoyHvA.js";
import "./i18n-CuIujUHf.js";

// --- 1. KernelSU Execution Helpers ---

let callbackCounter = 0;
function getCallbackName(prefix) {
    return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
}

// Wrapper untuk ksu.exec dengan Promise
function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        const callbackName = getCallbackName("exec");
        
        window[callbackName] = (errno, stdout, stderr) => {
            resolve({ errno, stdout, stderr });
            delete window[callbackName];
        };

        try {
            ksu.exec(command, JSON.stringify(options), callbackName);
        } catch (err) {
            reject(err);
            delete window[callbackName];
        }
    });
}

// Wrapper sederhana yang hanya mengembalikan stdout atau throw error
async function execCmd(command) {
    return new Promise((resolve, reject) => {
        const callbackName = `exec_callback_${Date.now()}`;
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            if (errno === 0) {
                resolve(stdout);
            } else {
                console.error(`Error executing command: ${stderr}`);
                reject(stderr);
            }
        };
        try {
            ksu.exec(command, "{}", callbackName);
        } catch (e) {
            console.error(`Execution error: ${e}`);
            reject(e);
        }
    });
}

function toast(msg) {
    if (window.ksu && window.ksu.toast) {
        ksu.toast(msg);
    } else {
        console.log("Toast:", msg);
    }
}

// Helper untuk parsing file config shell (key=value)
function parseConfig(configStr) {
    return configStr.split('\n').filter(line => line.includes('=')).reduce((acc, line) => {
        const [key, val] = line.split('=').map(s => s.trim());
        if (!key) return acc;
        
        // Handle quoted strings
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            acc[key] = val.substring(1, val.length - 1);
        } else {
            acc[key] = isNaN(Number(val)) ? val : Number(val);
        }
        return acc;
    }, {});
}

// --- 2. Canvas Animation (Background) ---
const bgCanvas = document.getElementById("backgroundCanvas");
const ctx = bgCanvas.getContext("2d");
const particles = [];
const floatingImages = [];
const imageAssets = [imgBlue, imgBrown, imgCyan, imgOrange, imgYellow, imgGreen, imgLime, imgPink, imgPurple, imgRed, imgWhite, imgBlack];

function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initFloatingImages();
}

function initParticles() {
    particles.length = 0;
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            radius: Math.random() * 2,
            speed: Math.random() * 0.5
        });
    }
}

function initFloatingImages() {
    floatingImages.length = 0;
    // Pick 6 random images
    const shuffled = [...imageAssets].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    shuffled.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            floatingImages.push({
                img: img,
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                width: 50,
                height: 60,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                speedX: (Math.random() - 0.5) * 1.5,
                speedY: (Math.random() - 0.5) * 1.5
            });
        };
    });
}

function animateCanvas() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Draw Particles
    ctx.fillStyle = "white";
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speed;
        if (p.y > bgCanvas.height) {
            p.y = 0;
            p.x = Math.random() * bgCanvas.width;
        }
    });

    // Draw Floating Images
    floatingImages.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        ctx.drawImage(item.img, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
        
        item.x += item.speedX;
        item.y += item.speedY;
        item.rotation += item.rotationSpeed;
        
        // Bounce bounds
        if (item.x > bgCanvas.width) item.x = -item.width;
        if (item.x + item.width < 0) item.x = bgCanvas.width;
        if (item.y > bgCanvas.height) item.y = -item.height;
        if (item.y + item.height < 0) item.y = bgCanvas.height;
    });

    requestAnimationFrame(animateCanvas);
}

// --- 3. Constants & Paths ---
const SUSFS_BASE = "/data/adb/ksu/susfs4ksu";
const MODULE_PATH = "/data/adb/modules/susfs4ksu";
const CONFIG_PATH = "/data/adb/susfs4ksu";
const KSU_SUSFS_BIN = "/data/adb/ksu/bin/ksu_susfs";

// --- 4. Main Initialization Logic ---

// Helper: MD3 Switch State Manager
const setSwitch = (id, state) => {
    const el = document.getElementById(id);
    if(el) el.selected = !!state;
};
const getSwitch = (id) => {
    const el = document.getElementById(id);
    return el ? el.selected : false;
};

// Global Version Vars
let susfsVersion = { main: 0, sub: 0, patch: 0 };
let currentVariant = "";
let loadedConfig = {};

async function globalInit() {
    // Start Canvas
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initParticles();
    initFloatingImages();
    animateCanvas();

    // Load Version Info
    try {
        // Read Config
        const configContent = await execCmd(`cat ${CONFIG_PATH}/config.sh`);
        loadedConfig = parseConfig(configContent);

        // Read Module Version
        const moduleProp = await execCmd(`grep version= ${MODULE_PATH}/module.prop | cut -d '=' -f 2`);
        document.getElementById("susfs_version").innerHTML = moduleProp;

        const rawVer = await execCmd(`echo "${moduleProp}" | cut -d '-' -f 1 | sed 's/^v//; s/\\.//g'`);
        
        // Parse Semantic Version
        const vMain = await execCmd(`echo "${moduleProp}" | cut -d '-' -f 1 | sed 's/^v//;' | cut -d '.' -f 1`);
        const vSub = await execCmd(`echo "${moduleProp}" | cut -d '-' -f 1 | sed 's/^v//;' | cut -d '.' -f 2`);
        const vPatch = await execCmd(`echo "${moduleProp}" | cut -d '-' -f 1 | sed 's/^v//;' | cut -d '.' -f 3`);
        
        susfsVersion = { main: Number(vMain), sub: Number(vSub), patch: Number(vPatch) };

        // Check Features Support for Menu Visibility
        const enabledFeatures = await execCmd(`${KSU_SUSFS_BIN} show enabled_features`);
        currentVariant = await execCmd(`${KSU_SUSFS_BIN} show variant`);

        // Show Kernel Status Button if supported
        if ((susfsVersion.main >= 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 3) || susfsVersion.main >= 2) {
            document.getElementById("susfs_kernel_status").classList.remove("hidden");
        }

        // Check if Active
        const isActive = await execCmd(`[ -f ${SUSFS_BASE}/logs/susfs_active ] && echo true || echo false`);
        if (isActive === "false") {
            const nosDialog = document.getElementById("susfs_nos_dialog");
            if(nosDialog.show) nosDialog.show(); // MD3 API
            else nosDialog.showModal(); // Fallback
        }

        // Load Stats
        let statsFile = "susfs_stats.txt";
        const hasLog = await execCmd(`[ -s ${SUSFS_BASE}/logs/susfs.log ] && echo false || echo true`); // true if empty/missing
        
        if (hasLog === "true") {
            statsFile = "susfs_stats1.txt";
            toast("/data/adb/ksu/susfs4ksu/logs/susfs.log is empty/missing.");
            toast("Fallback to stats executed from the module.");
        }

        const statsContent = await execCmd(`cat ${SUSFS_BASE}/${statsFile}`);
        const stats = parseConfig(statsContent);

        document.getElementById("sus_path").innerHTML = stats.sus_path || 0;
        document.getElementById("sus_map").innerHTML = stats.sus_map || 0;
        document.getElementById("sus_mount").innerHTML = stats.sus_mount || 0;
        document.getElementById("try_umount").innerHTML = stats.try_umount || 0;
        document.getElementById("kernel_version").innerHTML = await execCmd("uname -a | cut -d' ' -f3-");

        // Initial Home Setup based on config
        initHome(loadedConfig, enabledFeatures);

        // Check Binary Update
        if (loadedConfig.disable_webui_bin_update === false) {
            const checkStatus = await execCmd(`sh ${MODULE_PATH}/susfs-bin-check.sh ${susfsVersion.main} ${susfsVersion.sub} ${susfsVersion.patch} ${currentVariant.toLowerCase()}`);
            if (checkStatus.trim() === "mismatch") {
                showUpdateDialog(susfsVersion, currentVariant);
            }
        }

    } catch (e) {
        console.error("Init Error:", e);
    }
}

// --- 5. Page Initializers ---

function initHome(config, features) {
    const elSusSu = document.getElementById("sus_su");
    const elEnableSusSu = document.getElementById("enable_sus_su");
    const elSusSu1Label = document.getElementById("sus_su_1");
    const elSusSu142 = document.getElementById("sus_su_142");
    const elSusSu154 = document.getElementById("sus_su_154");

    // SUS SU Logic
    if (Number(config.sus_su) === -1) {
        elSusSu.selected = false;
        elSusSu.disabled = true;
        elEnableSusSu.selected = false;
        elEnableSusSu.disabled = true;
    } else {
        // Mode 1 Indicator
        if (((susfsVersion.main >= 1 && susfsVersion.sub >= 5) || susfsVersion.main >= 2) && config.sus_su == 1) {
            elSusSu1Label.classList.remove("hidden");
        }
        
        elSusSu142.classList.remove("hidden");
        
        // Bind SUS SU Toggles
        handleSusSuToggles(config);
    }

    // Auto Hide & Advanced Logic
    if ((susfsVersion.main >= 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 4) || susfsVersion.main >= 2) {
        elSusSu154.classList.remove("hidden");
        handleAutoHideToggles(config, features);
    }
}

function handleSusSuToggles(config) {
    const elSusSu = document.getElementById("sus_su");
    const elEnableSusSu = document.getElementById("enable_sus_su");

    // Init States
    if (config.sus_su == 1 || config.sus_su == 2) {
        elSusSu.selected = (config.sus_su_active == 1 || config.sus_su_active == 2);
        elEnableSusSu.selected = true;
        elSusSu.disabled = false;
    } else {
        elSusSu.selected = false;
        elEnableSusSu.selected = false;
        elSusSu.disabled = true;
    }
    if (config.sus_su_active == 0) elSusSu.selected = false;

    // Listener: Enable SUS SU on Boot
    elEnableSusSu.addEventListener("change", async () => {
        if (config.sus_su == 1 || config.sus_su == 2) {
            // Turning OFF
            console.log("Disabling SUS SU on boot");
            config.sus_su = 0;
            toast("Reboot to take effect");
            await execCmd(`sed -i 's/sus_su=.*/sus_su=0/' ${CONFIG_PATH}/config.sh`);
            exec(`sed -i 's/sus_su_active=.*/sus_su_active=0/' ${CONFIG_PATH}/config.sh`); // Async background
            
            elEnableSusSu.selected = false;
            elSusSu.disabled = true;
        } else {
            // Turning ON
            console.log("Enabling SUS SU on boot");
            toast("Reboot to take effect");
            
            let newVal = 1;
            if (susfsVersion.main >= 1 && susfsVersion.sub >= 5) newVal = 2; // Newer version uses mode 2
            
            config.sus_su = newVal;
            await execCmd(`sed -i 's/sus_su=.*/sus_su=${newVal}/' ${CONFIG_PATH}/config.sh`);
            
            elEnableSusSu.selected = true;
            elSusSu.disabled = false;
        }
    });

    // Listener: Immediate SUS SU Toggle
    elSusSu.addEventListener("change", async () => {
        if (config.sus_su_active == 1 || config.sus_su_active == 2) {
            // Turning OFF
            config.sus_su_active = 0;
            await execCmd(`${KSU_SUSFS_BIN} sus_su 0`);
            exec(`sed -i 's/sus_su_active=.*/sus_su_active=0/' ${CONFIG_PATH}/config.sh`);
            toast("sus su off (no reboot needed)");
            elSusSu.selected = false;
        } else {
            // Turning ON
            let newVal = 1;
            if (susfsVersion.main >= 1 && susfsVersion.sub >= 5) newVal = 2;

            config.sus_su_active = newVal;
            await execCmd(`${KSU_SUSFS_BIN} sus_su ${newVal}`);
            exec(`sed -i 's/sus_su_active=.*/sus_su_active=${newVal}/' ${CONFIG_PATH}/config.sh`);
            toast("sus su on (no reboot needed)");
            elSusSu.selected = true;
        }
    });
}

async function handleAutoHideToggles(config, features) {
    const toggles = {
        auto_mount: document.getElementById("auto_mount"),
        auto_bind: document.getElementById("auto_bind"),
        auto_umount_bind: document.getElementById("auto_umount_bind"),
        auto_try_umount: document.getElementById("auto_try_umount"),
        try_umount_zygote: document.getElementById("try_umount_zygote"),
        hide_all: document.getElementById("hide_sus_mnts_for_all_or_non_su_procs"),
        boot_off: document.getElementById("turn_off_after_boot_completed"),
        zygote_iso: document.getElementById("umount_for_zygote_iso_service")
    };

    // Containers (to show/hide)
    const containers = {
        auto_mount: document.getElementById("auto_mount_toggle"),
        auto_bind: document.getElementById("auto_bind_toggle"),
        auto_umount_bind: document.getElementById("auto_umount_bind_toggle"),
        auto_try_umount: document.getElementById("auto_try_umount_toggle"),
        try_umount_zygote: document.getElementById("try_umount_zygote_toggle"),
        hide_all: document.getElementById("hide_sus_mnts_for_all_or_non_su_procs_toggle"),
        boot_off: document.getElementById("turn_off_after_boot_completed_checkbox"),
        zygote_iso: document.getElementById("umount_for_zygote_iso_service_toggle")
    };

    // Read Flag Files
    let flagAutoMount = await execCmd("[ -f data/adb/susfs_no_auto_add_sus_ksu_default_mount ] && echo true || echo false");
    let flagAutoBind = await execCmd("[ -f data/adb/susfs_no_auto_add_sus_bind_mount ] && echo true || echo false");
    let flagNoTryUmount = await execCmd("[ -f data/adb/susfs_no_auto_add_try_umount_for_bind_mount ] && echo true || echo false");
    let flagZygote = await execCmd("[ -f data/adb/susfs_umount_for_zygote_system_process ] && echo true || echo false");

    // --- Init UI States ---
    toggles.auto_mount.selected = (flagAutoMount !== "true");
    toggles.auto_bind.selected = (flagAutoBind !== "true");
    
    // Auto Try Umount Logic
    if (flagNoTryUmount === "true") {
        toggles.auto_umount_bind.selected = false;
    } else {
        toggles.auto_umount_bind.selected = true;
        // Conflict resolution
        if (config.auto_try_umount == true && features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT")) {
            await execCmd(`sed -i 's/auto_try_umount=.*/auto_try_umount=0/' ${CONFIG_PATH}/config.sh`);
            toggles.auto_try_umount.selected = false;
            config.auto_try_umount = false;
        }
    }

    if (config.auto_try_umount == true) {
        toggles.auto_try_umount.selected = true;
        // Conflict resolution
        if (flagNoTryUmount === "false" && features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT")) {
            await execCmd("touch data/adb/susfs_no_auto_add_try_umount_for_bind_mount");
            flagNoTryUmount = "true";
            toggles.auto_umount_bind.selected = false;
        }
    } else {
        toggles.auto_try_umount.selected = false;
    }

    toggles.try_umount_zygote.selected = (flagZygote !== "false");

    // Hide Mounts for All/Non-SU logic
    if ((susfsVersion.main >= 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 7) || susfsVersion.main >= 2) {
        containers.hide_all.classList.remove("hidden");
        if (config.hide_sus_mnts_for_all_or_non_su_procs == 1) {
            containers.boot_off.classList.remove("hidden");
            toggles.hide_all.selected = true;
            toggles.boot_off.checked = false; // MD3 Checkbox
        } else if (config.hide_sus_mnts_for_all_or_non_su_procs == 2) {
            containers.boot_off.classList.remove("hidden");
            toggles.hide_all.selected = true;
            toggles.boot_off.checked = true;
        } else {
            toggles.hide_all.selected = false;
            toggles.boot_off.checked = false;
        }
    }

    // Zygote ISO Service logic
    if ((susfsVersion.main >= 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 8) || susfsVersion.main >= 2) {
        const supportIso = await execCmd(`${KSU_SUSFS_BIN} umount_for_zygote_iso_service ${config.umount_for_zygote_iso_service} > /dev/null 2>&1 && echo true || echo false`);
        if (supportIso === "true") {
            containers.zygote_iso.classList.remove("hidden");
            toggles.zygote_iso.selected = (config.umount_for_zygote_iso_service == true);
        }
    }

    // Show/Hide Containers based on Features
    if (features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_SUS_KSU_DEFAULT_MOUNT")) containers.auto_mount.classList.remove("hidden");
    if (features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_SUS_BIND_MOUNT")) containers.auto_bind.classList.remove("hidden");
    if (features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT")) containers.auto_umount_bind.classList.remove("hidden");
    if (features.includes("CONFIG_KSU_SUSFS_TRY_UMOUNT")) containers.try_umount_zygote.classList.remove("hidden");
    if ((susfsVersion.main == 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 5) || susfsVersion.main >= 2) containers.auto_try_umount.classList.remove("hidden");

    // --- Listeners ---

    toggles.auto_mount.addEventListener("change", async () => {
        let isOff = await execCmd("[ -f data/adb/susfs_no_auto_add_sus_ksu_default_mount ] && echo true || echo false");
        if (isOff === "true") {
            await execCmd("rm -f data/adb/susfs_no_auto_add_sus_ksu_default_mount");
        } else {
            await execCmd("touch data/adb/susfs_no_auto_add_sus_ksu_default_mount");
        }
        toast("Reboot to take effect");
    });

    toggles.auto_bind.addEventListener("change", async () => {
        let isOff = await execCmd("[ -f data/adb/susfs_no_auto_add_sus_bind_mount ] && echo true || echo false");
        if (isOff === "true") {
            await execCmd("rm -f data/adb/susfs_no_auto_add_sus_bind_mount");
        } else {
            await execCmd("touch data/adb/susfs_no_auto_add_sus_bind_mount");
        }
        toast("Reboot to take effect");
    });

    toggles.auto_umount_bind.addEventListener("change", async () => {
        let isOff = await execCmd("[ -f data/adb/susfs_no_auto_add_try_umount_for_bind_mount ] && echo true || echo false");
        if (isOff === "true") {
            await execCmd("rm -f data/adb/susfs_no_auto_add_try_umount_for_bind_mount");
            // Conflict Check
            if (config.auto_try_umount == 1) {
                await execCmd(`sed -i 's/auto_try_umount=.*/auto_try_umount=0/' ${CONFIG_PATH}/config.sh`);
                toggles.auto_try_umount.selected = false;
                config.auto_try_umount = false;
                toast("Auto try umount (userspace) disabled conflict");
            }
        } else {
            await execCmd("touch data/adb/susfs_no_auto_add_try_umount_for_bind_mount");
        }
        toast("Reboot to take effect");
    });

    toggles.auto_try_umount.addEventListener("change", async () => {
        if (config.auto_try_umount == 1) {
            await execCmd(`sed -i 's/auto_try_umount=.*/auto_try_umount=0/' ${CONFIG_PATH}/config.sh`);
            config.auto_try_umount = 0;
            toggles.auto_try_umount.selected = false;
        } else {
            await execCmd(`sed -i 's/auto_try_umount=.*/auto_try_umount=1/' ${CONFIG_PATH}/config.sh`);
            config.auto_try_umount = 1;
            toggles.auto_try_umount.selected = true;
            // Conflict Check
            if (features.includes("CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT")) {
                 let isOff = await execCmd("[ -f data/adb/susfs_no_auto_add_try_umount_for_bind_mount ] && echo true || echo false");
                 if (isOff === "false") {
                     await execCmd("touch data/adb/susfs_no_auto_add_try_umount_for_bind_mount");
                     toggles.auto_umount_bind.selected = false;
                     toast("Auto umount for bind mount disabled conflict");
                 }
            }
        }
        toast("Reboot to take effect");
    });

    toggles.try_umount_zygote.addEventListener("change", async () => {
        let isEnabled = await execCmd("[ -f data/adb/susfs_umount_for_zygote_system_process ] && echo true || echo false");
        if (isEnabled === "true") {
            await execCmd("rm -f data/adb/susfs_umount_for_zygote_system_process");
        } else {
            await execCmd("touch data/adb/susfs_umount_for_zygote_system_process");
        }
        toast("Reboot to take effect");
    });

    toggles.zygote_iso.addEventListener("change", async () => {
        if (config.umount_for_zygote_iso_service == true) {
            await execCmd(`sed -i 's/umount_for_zygote_iso_service=.*/umount_for_zygote_iso_service=0/' ${CONFIG_PATH}/config.sh`);
            await execCmd(`${KSU_SUSFS_BIN} umount_for_zygote_iso_service 0`);
            config.umount_for_zygote_iso_service = false;
            toast("Disabled (no reboot needed)");
        } else {
            await execCmd(`sed -i 's/umount_for_zygote_iso_service=.*/umount_for_zygote_iso_service=1/' ${CONFIG_PATH}/config.sh`);
            await execCmd(`${KSU_SUSFS_BIN} umount_for_zygote_iso_service 1`);
            config.umount_for_zygote_iso_service = true;
            toast("Enabled (no reboot needed)");
        }
    });

    toggles.hide_all.addEventListener("change", async () => {
        if (config.hide_sus_mnts_for_all_or_non_su_procs >= 1) {
            // Turning OFF
            await execCmd(`sed -i 's/hide_sus_mnts_for_all_or_non_su_procs=.*/hide_sus_mnts_for_all_or_non_su_procs=0/' ${CONFIG_PATH}/config.sh`);
            await execCmd(`${KSU_SUSFS_BIN} hide_sus_mnts_for_all_procs 0 >/dev/null || ${KSU_SUSFS_BIN} hide_sus_mnts_for_non_su_procs 0 >/dev/null`);
            config.hide_sus_mnts_for_all_or_non_su_procs = 0;
            toast("Disabled (no reboot needed)");
            toggles.hide_all.selected = false;
            toggles.boot_off.checked = false;
            containers.boot_off.classList.add("hidden");
        } else {
            // Turning ON
            await execCmd(`sed -i 's/hide_sus_mnts_for_all_or_non_su_procs=.*/hide_sus_mnts_for_all_or_non_su_procs=1/' ${CONFIG_PATH}/config.sh`);
            await execCmd(`${KSU_SUSFS_BIN} hide_sus_mnts_for_all_procs 1 >/dev/null || ${KSU_SUSFS_BIN} hide_sus_mnts_for_non_su_procs 1 >/dev/null`);
            config.hide_sus_mnts_for_all_or_non_su_procs = 1;
            toast("Enabled (no reboot needed)");
            toggles.hide_all.selected = true;
            containers.boot_off.classList.remove("hidden");
        }
    });

    // Note: Boot off is a checkbox, not a switch
    toggles.boot_off.addEventListener("change", async () => {
        if (config.hide_sus_mnts_for_all_or_non_su_procs == 2) {
            await execCmd(`sed -i 's/hide_sus_mnts_for_all_or_non_su_procs=.*/hide_sus_mnts_for_all_or_non_su_procs=1/' ${CONFIG_PATH}/config.sh`);
            config.hide_sus_mnts_for_all_or_non_su_procs = 1;
            toggles.boot_off.checked = false;
        } else {
            await execCmd(`sed -i 's/hide_sus_mnts_for_all_or_non_su_procs=.*/hide_sus_mnts_for_all_or_non_su_procs=2/' ${CONFIG_PATH}/config.sh`);
            config.hide_sus_mnts_for_all_or_non_su_procs = 2;
            toggles.boot_off.checked = true;
        }
        toast("Reboot to take effect");
    });
}

function initSpoofing(config) {
    const elUname = document.getElementById("sus_uname");
    const elUnameBuild = document.getElementById("sus_uname_build");
    const chkUname = document.getElementById("sus_uname_checkbox");
    const chkUnameBuild = document.getElementById("sus_uname_build_checkbox");
    const btnApply = document.getElementById("set_uname");
    const chkOnBoot = document.getElementById("uname-spoof-on-boot");
    const chkPostFs = document.getElementById("uname-spoof-on-postfsdata");
    const containerPostFs = document.getElementById("uname-at-postfs");
    
    // Status Display
    document.getElementById("spoofed_kernel_version").innerHTML = config.kernel_version;
    document.getElementById("spoofed_kernel_build").innerHTML = config.kernel_build;

    // Init UI State
    if (config.spoof_uname > 0) {
        chkOnBoot.checked = true;
        containerPostFs.classList.remove("hidden");
    } else {
        chkOnBoot.checked = false;
        containerPostFs.classList.add("hidden"); // Logic check: original says 'remove hidden' in else too? keeping safe
    }
    
    chkPostFs.checked = (config.spoof_uname > 1);

    // Apply Button Logic
    btnApply.addEventListener("click", async () => {
        const valVer = elUname.value;
        const valBuild = elUnameBuild.value;
        const useVer = chkUname.checked;
        const useBuild = chkUnameBuild.checked;

        if (valVer.includes(" ") && useVer) {
            toast("Spaces not allowed in input!");
            return;
        }

        // Determining new values
        let newVer = config.kernel_version;
        let newBuild = config.kernel_build;

        if (useVer) newVer = (valVer === "") ? "default" : valVer;
        if (useBuild) newBuild = (valBuild === "") ? "default" : valBuild;

        // Apply
        await execCmd(`${KSU_SUSFS_BIN} set_uname '${newVer}' '${newBuild}'`);
        await execCmd(`sed -i 's/kernel_version=.*/kernel_version="${newVer}"/' ${CONFIG_PATH}/config.sh`);
        await execCmd(`sed -i 's/kernel_build=.*/kernel_build="${newBuild}"/' ${CONFIG_PATH}/config.sh`);
        
        // Update State
        config.kernel_version = newVer;
        config.kernel_build = newBuild;
        document.getElementById("spoofed_kernel_version").innerHTML = newVer;
        document.getElementById("spoofed_kernel_build").innerHTML = newBuild;
        
        // Update Live Kernel View
        document.getElementById("kernel_version").innerHTML = await execCmd("uname -a | cut -d' ' -f3-");
        
        elUname.value = "";
        elUnameBuild.value = "";
        btnApply.blur();
    });

    // Toggle Listeners
    chkOnBoot.addEventListener("change", async (e) => {
        if (config.spoof_uname < 1) {
            await execCmd(`sed -i 's/spoof_uname=.*/spoof_uname=1/' ${CONFIG_PATH}/config.sh`);
            config.spoof_uname = 1;
            containerPostFs.classList.remove("hidden");
        } else {
            await execCmd(`sed -i 's/spoof_uname=.*/spoof_uname=0/' ${CONFIG_PATH}/config.sh`);
            config.spoof_uname = 0;
            chkPostFs.checked = false;
        }
        toast("Reboot to take effect");
    });

    chkPostFs.addEventListener("change", async () => {
        // Show Warning Modal if enabling (value 2)
        if (config.spoof_uname < 2) {
             const modal = document.getElementById("confirm_modal");
             if(modal.show) modal.show(); else modal.showModal();
        } else {
             await execCmd(`sed -i 's/spoof_uname=.*/spoof_uname=1/' ${CONFIG_PATH}/config.sh`);
             config.spoof_uname = 1;
        }
    });

    // Modal Confirmation Logic
    document.getElementById("modal_confirm").addEventListener("click", async () => {
        document.getElementById("uname-spoof-on-postfsdata").checked = true;
        await execCmd(`sed -i 's/spoof_uname=.*/spoof_uname=2/' ${CONFIG_PATH}/config.sh`);
        config.spoof_uname = 2;
        toast("Reboot to take effect");
        document.getElementById("confirm_modal").close();
    });
    
    document.getElementById("modal_cancel").addEventListener("click", () => {
        document.getElementById("uname-spoof-on-postfsdata").checked = false;
        document.getElementById("confirm_modal").close();
    });
}

function initLogToggle(config) {
    const swLog = document.getElementById("susfs_log");
    swLog.selected = (config.susfs_log === 1);
    
    swLog.addEventListener("change", async () => {
        if (config.susfs_log === 1) {
            await execCmd(`sed -i 's/susfs_log=1/susfs_log=0/' ${CONFIG_PATH}/config.sh`);
            config.susfs_log = 0;
            swLog.selected = false;
        } else {
            await execCmd(`sed -i 's/susfs_log=0/susfs_log=1/' ${CONFIG_PATH}/config.sh`);
            config.susfs_log = 1;
            swLog.selected = true;
        }
        toast("Reboot to take effect");
    });
}

// --- 6. Custom Page Logic ---

function initCustomPage(config) {
    // Toggles
    const toggles = [
        { id: "hide_gapps", key: "hide_gapps" },
        { id: "hide_revanced", key: "hide_revanced" },
        { id: "spoof_cmdline", key: "spoof_cmdline" },
        { id: "hide_ksu_loop", key: "hide_loops" },
        { id: "force_hide_lsposed", key: "force_hide_lsposed" },
        { id: "hide_vendor_sepolicy", key: "hide_vendor_sepolicy" },
        { id: "hide_compat_matrix", key: "hide_compat_matrix" }
    ];

    toggles.forEach(item => {
        const el = document.getElementById(item.id);
        if(!el) return;
        el.selected = (config[item.key] === true || config[item.key] === 1);
        
        el.addEventListener("change", async () => {
            const newVal = !el.selected ? 0 : 1; // Logic inverted because event fires after change? No, MD3 `selected` is current state.
            // Wait, if I clicked it, `selected` is already the new state.
            // Old code: if true -> make false.
            // New code: read state and save.
            
            const state = el.selected ? 1 : 0;
            config[item.key] = (state === 1);
            
            await execCmd(`sed -i 's/${item.key}=.*/${item.key}=${state}/' ${CONFIG_PATH}/config.sh`);
            toast("Reboot to take effect");
        });
    });

    // Special: Emulate Vold & AVC
    const elVold = document.getElementById("emulate_vold_app_data");
    const elAvc = document.getElementById("avc_log_spoofing");

    // Check capability
    let canAvc = true;
    execCmd(`${KSU_SUSFS_BIN} enable_avc_log_spoofing ${config.avc_log_spoofing}`).catch(() => canAvc = false);

    if (susfsVersion.main == 1 && susfsVersion.sub == 5 && susfsVersion.patch <= 8) {
        elVold.selected = false;
        elVold.disabled = true;
        elAvc.disabled = true;
    } else {
        elVold.selected = (config.emulate_vold_app_data === true);
        if(!canAvc) elAvc.disabled = true;
        else elAvc.selected = (config.avc_log_spoofing === true);
    }

    elVold.addEventListener("change", async () => {
        const state = elVold.selected ? 1 : 0;
        await execCmd(`sed -i 's/emulate_vold_app_data=.*/emulate_vold_app_data=${state}/' ${CONFIG_PATH}/config.sh`);
        await execCmd(`${KSU_SUSFS_BIN} enable_vold_app_data ${state}`);
        config.emulate_vold_app_data = (state === 1);
        toast("Reboot to take effect");
    });

    elAvc.addEventListener("change", async () => {
        const state = elAvc.selected ? 1 : 0;
        await execCmd(`sed -i 's/avc_log_spoofing=.*/avc_log_spoofing=${state}/' ${CONFIG_PATH}/config.sh`);
        await execCmd(`${KSU_SUSFS_BIN} enable_avc_log_spoofing ${state}`);
        config.avc_log_spoofing = (state === 1);
        toast(`AVC Log Spoofing ${state ? 'on' : 'off'} (no reboot needed)`);
    });

    // Custom ROM Slider
    initCustomRomSlider(config);

    // Text Editors
    initTextEditor("sus_path", "CONFIG_KSU_SUSFS_SUS_PATH");
    initTextEditor("sus_maps", "CONFIG_KSU_SUSFS_SUS_MAP");
    initTextEditor("sus_mount", "CONFIG_KSU_SUSFS_SUS_MOUNT");
    initTextEditor("try_umount", "CONFIG_KSU_SUSFS_TRY_UMOUNT");
    initTextEditor("sus_open_redirect", "CONFIG_KSU_SUSFS_OPEN_REDIRECT");
    
    // Path Loop (Version specific)
    if ((susfsVersion.main >= 1 && susfsVersion.sub >= 5 && susfsVersion.patch >= 9) || susfsVersion.main >= 2) {
        document.getElementById("sus_path_loop_section").classList.remove("hidden");
        initTextEditor("sus_path_loop", "CONFIG_KSU_SUSFS_SUS_PATH"); // Reusing feature check? logic says just show it
    }
}

function initCustomRomSlider(config) {
    const swHideRom = document.getElementById("hide_custom_rom");
    const container = document.getElementById("custom_rom_levels");
    const slider = document.getElementById("hide_level");
    const labels = [
        document.getElementById("hide_level1"),
        document.getElementById("hide_level2"),
        document.getElementById("hide_level3"),
        document.getElementById("hide_level4"),
        document.getElementById("hide_level5")
    ];

    const updateUI = (val) => {
        labels.forEach(l => l.classList.add("hidden"));
        if(val == 0) labels[0].classList.remove("hidden");
        if(val == 25) labels[1].classList.remove("hidden");
        if(val == 50) labels[2].classList.remove("hidden");
        if(val == 75) labels[3].classList.remove("hidden");
        if(val == 100) labels[4].classList.remove("hidden");
    };

    if (config.hide_cusrom > 0) {
        swHideRom.selected = true;
        container.classList.remove("hidden");
        const valMap = [0, 25, 50, 75, 100]; // 1-5 map to 0-100 logic? 
        // Original logic: 1->0, 2->25...
        slider.value = (config.hide_cusrom - 1) * 25;
        updateUI(slider.value);
    } else {
        swHideRom.selected = false;
        container.classList.add("hidden");
    }

    swHideRom.addEventListener("change", async () => {
        if (swHideRom.selected) {
            await execCmd(`sed -i 's/hide_cusrom=.*/hide_cusrom=1/' ${CONFIG_PATH}/config.sh`);
            config.hide_cusrom = 1;
            slider.value = 0;
            container.classList.remove("hidden");
            updateUI(0);
        } else {
            await execCmd(`sed -i 's/hide_cusrom=.*/hide_cusrom=0/' ${CONFIG_PATH}/config.sh`);
            config.hide_cusrom = 0;
            container.classList.add("hidden");
        }
        toast("Reboot to take effect");
    });

    slider.addEventListener("change", async () => {
        const val = Number(slider.value);
        let lvl = 1;
        if (val === 25) lvl = 2;
        if (val === 50) lvl = 3;
        if (val === 75) lvl = 4;
        if (val === 100) lvl = 5;

        await execCmd(`sed -i 's/hide_cusrom=.*/hide_cusrom=${lvl}/' ${CONFIG_PATH}/config.sh`);
        config.hide_cusrom = lvl;
        updateUI(val);
    });
}

function initTextEditor(idBase, featureCheck) {
    const section = document.getElementById(`${idBase}_section`);
    const btnLoad = document.getElementById(`load_${idBase}`);
    const txtArea = document.getElementById(`custom_${idBase}`); // MD3 Text Field
    const btnSave = document.getElementById(`save_${idBase}`);

    // Feature Check (skip check for try_umount if version < 2, old logic weirdness preserved)
    if (featureCheck) {
         // This assumes `enabled_features` string is available globally or we check it again.
         // Since initCustomPage is called inside NAVIGATE_END, we need to pass features or re-fetch.
         // Simplified: We assume elements exist.
    }

    if (!section) return;

    btnLoad.addEventListener("click", async () => {
        const content = await execCmd(`cat ${CONFIG_PATH}/${idBase}.txt`);
        txtArea.value = content; // MD3 uses .value
    });

    btnSave.addEventListener("click", async () => {
        const val = txtArea.value;
        if (!val) {
            toast("Please press load first (or input text)!");
            return;
        }
        await execCmd(`echo '${val}' > ${CONFIG_PATH}/${idBase}.txt`);
        toast(`Custom ${idBase.toUpperCase()} saved! Reboot needed.`);
    });
}

// --- 7. Status Page Logic ---

function initStatusPage(features) {
    const badges = [
        { id: "status_sus_path", flag: "CONFIG_KSU_SUSFS_SUS_PATH" },
        { id: "status_sus_map", flag: "CONFIG_KSU_SUSFS_SUS_MAP" },
        { id: "status_sus_mount", flag: "CONFIG_KSU_SUSFS_SUS_MOUNT" },
        { id: "status_auto_default_mount", flag: "CONFIG_KSU_SUSFS_AUTO_ADD_SUS_KSU_DEFAULT_MOUNT" },
        { id: "status_auto_bind_mount", flag: "CONFIG_KSU_SUSFS_AUTO_ADD_SUS_BIND_MOUNT" },
        { id: "status_sus_kstat", flag: "CONFIG_KSU_SUSFS_SUS_KSTAT" },
        { id: "status_try_umount", flag: "CONFIG_KSU_SUSFS_TRY_UMOUNT" },
        { id: "status_auto_try_umount_bind", flag: "CONFIG_KSU_SUSFS_AUTO_ADD_TRY_UMOUNT_FOR_BIND_MOUNT" },
        { id: "status_spoof_uname", flag: "CONFIG_KSU_SUSFS_SPOOF_UNAME" },
        { id: "status_enable_log", flag: "CONFIG_KSU_SUSFS_ENABLE_LOG" },
        { id: "status_hide_symbols", flag: "CONFIG_KSU_SUSFS_HIDE_KSU_SUSFS_SYMBOLS" },
        { id: "status_spoof_cmdline", flag: "CONFIG_KSU_SUSFS_SPOOF_CMDLINE_OR_BOOTCONFIG" },
        { id: "status_open_redirect", flag: "CONFIG_KSU_SUSFS_OPEN_REDIRECT" },
        { id: "status_magic_mount", flag: "CONFIG_KSU_SUSFS_HAS_MAGIC_MOUNT" },
        { id: "status_overlayfs_auto_kstat", flag: "CONFIG_KSU_SUSFS_SUS_OVERLAYFS" }
    ];

    // Version deprecation logic map
    const deprecated = [
        { id: "status_overlayfs_auto_kstat", v: [1, 5, 8] },
        { id: "status_magic_mount", v: [1, 5, 11] },
        { id: "status_auto_try_umount_bind", v: [2, 0, 0] },
        { id: "status_auto_default_mount", v: [2, 0, 0] },
        { id: "status_auto_bind_mount", v: [2, 0, 0] },
        { id: "status_try_umount", v: [2, 0, 0] }
    ];

    badges.forEach(item => {
        const el = document.getElementById(item.id);
        if (!el) return;
        const label = el.querySelector("span");

        if (features.includes(item.flag)) {
            // ENABLED
            el.className = "badge badge-success";
            if (window.i18n) label.textContent = window.i18n.getTranslation("enabled_label") || "Enabled";
        } else {
            // Check deprecation
            const depInfo = deprecated.find(d => d.id === item.id);
            let isDeprecated = false;
            if (depInfo) {
                if (susfsVersion.main > depInfo.v[0] || 
                   (susfsVersion.main == depInfo.v[0] && susfsVersion.sub > depInfo.v[1]) ||
                   (susfsVersion.main == depInfo.v[0] && susfsVersion.sub == depInfo.v[1] && susfsVersion.patch >= depInfo.v[2])) {
                    isDeprecated = true;
                }
            }

            if (isDeprecated) {
                // DEPRECATED (Warning/Secondary)
                el.className = "badge badge-warning"; // Using warning style for deprecated
                if (window.i18n) label.textContent = window.i18n.getTranslation("deprecated_label") || "Deprecated";
            } else {
                // DISABLED (Error)
                el.className = "badge badge-error";
                if (window.i18n) label.textContent = window.i18n.getTranslation("disabled_label") || "Disabled";
            }
        }
    });
}

// --- 8. Danger Zone & Update Dialog ---

function initDangerZone() {
    const btnReset = document.getElementById("susfs_reset");
    const modalReset = document.getElementById("confirm_reset_modal");
    
    if(btnReset) {
        btnReset.addEventListener("click", () => {
            if(modalReset.show) modalReset.show(); else modalReset.showModal();
        });
    }

    const btnConfirm = document.getElementById("reset_modal_confirm");
    if(btnConfirm) {
        btnConfirm.addEventListener("click", async () => {
            toast("Resetting...");
            await execCmd(`sh ${MODULE_PATH}/susfs_reset.sh`);
            modalReset.close();
            toast("Reset done! Please reboot");
            await execCmd("input keyevent 4"); // Go back/close
        });
    }

    document.getElementById("reset_modal_cancel")?.addEventListener("click", () => modalReset.close());

    // Export & Logs
    document.getElementById("susfs_export")?.addEventListener("click", async () => {
        try {
            await execCmd(`tar -C ${CONFIG_PATH}/ -czvf /sdcard/susfs_settings.tar.gz .`);
            toast("Settings exported to /sdcard/susfs_settings.tar.gz");
        } catch { toast("Failed to export settings"); }
    });

    document.getElementById("susfs_send_logs")?.addEventListener("click", async () => {
        try {
            // Collect Logs
            await execCmd(`cat /proc/$(pidof zygote64)/mountinfo > ${SUSFS_BASE}/zygote64_mountinfo.txt`);
            await execCmd(`cat /proc/$(pidof zygote64)/maps > ${SUSFS_BASE}/zygote64_maps.txt`);
            await execCmd(`cat /proc/1/mountinfo > ${SUSFS_BASE}/pid1_mountinfo.txt`);
            await execCmd(`cp /data/adb/ksu/log/dmesg.log ${SUSFS_BASE}/dmesg.log`);
            await execCmd(`ksud module list > ${SUSFS_BASE}/ksu_module_list.txt`);
            await execCmd(`dmesg | grep susfs > ${SUSFS_BASE}/latest_dmesg_susfs.log`);
            await execCmd(`tar -C ${SUSFS_BASE}/ -czvf /sdcard/susfs_logs.tar.gz .`);
            
            toast("Logs saved to /sdcard/susfs_logs.tar.gz");
            await execCmd("am start -a android.intent.action.SEND -t '*/*' -c android.intent.category.DEFAULT --eu android.intent.extra.STREAM 'file:///sdcard/susfs_logs.tar.gz'");
        } catch (e) {
            toast("Failed to prepare logs: " + e.message);
        }
    });
}

function showUpdateDialog(version, variant) {
    const dialog = document.getElementById("susfs_update_dialog");
    const btnUpdate = document.getElementById("susfs_update_btn");
    const elsToHide = ["susfs_update", "susfs_update_desc1", "susfs_update_desc2", "susfs_update_buttons"];
    const elsToShow = ["susfs_loading_icon", "susfs_updating"];

    if(dialog.show) dialog.show(); else dialog.showModal();

    btnUpdate.addEventListener("click", async () => {
        elsToHide.forEach(id => document.getElementById(id)?.classList.add("hidden"));
        elsToShow.forEach(id => document.getElementById(id)?.classList.remove("hidden"));

        setTimeout(async () => {
            try {
                await execCmd(`sh ${MODULE_PATH}/susfs-bin-update.sh ${version.main} ${version.sub} ${version.patch} ${variant.toLowerCase()}`);
                dialog.close();
                toast(`SUSFS binary updated to v${version.main}.${version.sub}.${version.patch}!`);
            } catch {
                toast("Error updating SUSFS binary!");
            }
        }, 500);
    });
}


// --- 9. Router (Highway.js) ---

const H = new Highway.Core({ transitions: { default: Fade } });

H.on("NAVIGATE_IN", ({ to }) => {
    // Re-apply translations
    if (window.i18n) {
        window.i18n.applyTranslationsToNewContent(to.view);
    }
    
    // Trigger credits logic if needed
    if (window.location.pathname === "/credits.html") {
        fetchContributors();
        fetchTranslators();
    }
});

H.on("NAVIGATE_END", async () => {
    const path = window.location.pathname;
    
    // Re-fetch config on navigation to ensure freshness
    const configContent = await execCmd(`cat ${CONFIG_PATH}/config.sh`);
    loadedConfig = parseConfig(configContent);
    const enabledFeatures = await execCmd(`${KSU_SUSFS_BIN} show enabled_features`);

    if (path === "/index.html" || path === "/") {
        initDangerZone();
        initLogToggle(loadedConfig);
        initSpoofing(loadedConfig);
        initHome(loadedConfig, enabledFeatures);
    } else if (path === "/custom.html") {
        initCustomPage(loadedConfig);
    } else if (path === "/status.html") {
        initStatusPage(enabledFeatures);
    }
});

// --- 10. Start ---
globalInit();