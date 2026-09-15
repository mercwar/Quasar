document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("nebula-canvas");
    const ctx = canvas.getContext("2d");

    // Lock canvas resolution to fixed 900x600 viewport
    canvas.width = 900;
    canvas.height = 600;

    function paintNebula() {
        ctx.clearRect(0, 0, 900, 600);

        for (let i = 0; i < 180; i++) {
            const sx = Math.random() * 900;
            const sy = Math.random() * 600;
            const sSize = Math.random() * 1.5;
            const alpha = Math.random() * 0.8 + 0.2;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath(); 
            ctx.arc(sx, sy, sSize, 0, Math.PI * 2); 
            ctx.fill();
        }
    }

    paintNebula();

    // Helper to decode URI parameters and strip hardcoded query strings
    function sanitizePath(path) {
        if (!path) return "";
        let clean = path;
        try {
            clean = decodeURIComponent(path);
        } catch (e) {
            clean = path;
        }
        // Strip any existing ? query parameters
        return clean.split("?")[0].trim();
    }

    // --- Load .quasar file with clean cache-busting timestamp ---
    const starField = document.getElementById("star-field");
    const urlParams = new URLSearchParams(window.location.search);
    const rawQuasarParam = urlParams.get("quasar");
    const quasarParam = sanitizePath(rawQuasarParam);

    if (quasarParam) {
        const quasarPath = '../' + quasarParam + `?t=${Date.now()}`;

        const hudTarget = document.getElementById("hud-target");
        if (hudTarget) {
            hudTarget.innerText = `Target: ${quasarParam.split("/").pop()}`;
        }

        fetch(quasarPath, { cache: "no-store" })
            .then(res => res.ok ? res.text() : Promise.reject(res.status))
            .then(csv => parseAndRender(csv))
            .catch(err => console.error("Failed to load quasar file:", err));
    }

    function parseAndRender(csvContent) {
        const cyborgFiles = [];
        csvContent.split(",").forEach(entry => {
            const trimmed = sanitizePath(entry);
            if (trimmed && trimmed.toLowerCase().endsWith(".cyborg")) {
                cyborgFiles.push(trimmed);
            }
        });

        const hudCount = document.getElementById("hud-count");
        if (hudCount) {
            hudCount.innerText = `Active Gates: ${cyborgFiles.length}`;
        }

        renderStargateStars(cyborgFiles.slice(0, 7)); // Enforce max 7 nodes
    }

    function renderStargateStars(files) {
        if (!starField) return;
        starField.innerHTML = "";

        // Fixed 900x600 pixel anchors ordered by focal priority
        const nodeAnchors = [
            { x: 203, y: 119 }, // Orange Top Left
            { x: 97, y: 264 },  // Orange Mid Left
            { x: 252, y: 387 }, // Orange Bottom Left
            { x: 777, y: 108 }, // Blue Top Right
            { x: 805, y: 307 }, // Blue Mid Right
            { x: 657, y: 389 }, // Blue Bottom Right
        ];

        files.forEach((file, i) => {
            if (i >= nodeAnchors.length) return;

            const star = document.createElement("div");
            star.className = "stargate-star";

            star.style.left = `${nodeAnchors[i].x}px`;
            star.style.top = `${nodeAnchors[i].y}px`;

            // Append subatomic orbital structures matching sg.css animation targets
            const ringB = document.createElement("div");
            ringB.className = "orbit-ring-b";

            const ringC = document.createElement("div");
            ringC.className = "orbit-ring-c";

            const electron = document.createElement("div");
            electron.className = "electron";

            star.appendChild(ringB);
            star.appendChild(ringC);
            star.appendChild(electron);

            const label = document.createElement("div");
            label.className = "star-label";
            label.innerText = file;

            star.appendChild(label);

            star.addEventListener("click", (e) => {
                e.stopPropagation();

                const cleanFile = sanitizePath(file);

                const hudTarget = document.getElementById("hud-target");
                if (hudTarget) {
                    hudTarget.innerText = `Engaged: ${cleanFile}`;
                }

                document.querySelectorAll(".stargate-star").forEach(s => s.classList.remove("active-gate"));
                star.classList.add("active-gate");

                const cyborgPath = '../' + cleanFile + `?t=${Date.now()}`;

                fetch(cyborgPath, { cache: "no-store" })
                    .then(res => res.ok ? res.text() : Promise.reject(res.status))
                    .then(content => renderCyborgModal(cleanFile, content))
                    .catch(err => {
                        console.error("Failed to load .cyborg file:", err);
                        renderCyborgModal(cleanFile, null, err);
                    });
            });

            starField.appendChild(star);
        });
    }

    // --- Dynamic Popup Modal Rendering ---
    function renderCyborgModal(filename, rawContent, error = null) {
        let modal = document.getElementById("cyborg-modal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "cyborg-modal";
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <span id="modal-title">CYBORG PAYLOAD</span>
                        <button id="modal-close">&times;</button>
                    </div>
                    <div id="modal-body"></div>
                </div>
            `;
            document.getElementById("viewport").appendChild(modal);

            document.getElementById("modal-close").addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        const modalTitle = document.getElementById("modal-title");
        const modalBody = document.getElementById("modal-body");

        modalTitle.innerText = `${filename}`;
        modalBody.innerHTML = "";

        if (error) {
            modalBody.innerHTML = `<div class="modal-error">[AVIS ERROR]: Failed to load asset stream (${error})</div>`;
        } else {
            const entries = rawContent.split(/[\r\n,]+/).map(item => sanitizePath(item)).filter(Boolean);

            if (entries.length === 0) {
                modalBody.innerHTML = `<div class="modal-empty">No target payload assets listed.</div>`;
            } else {
                const list = document.createElement("ul");
                list.className = "cyborg-file-list";

                entries.forEach(item => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    
                    const cleanItem = sanitizePath(item);
                    
                    if (cleanItem.toLowerCase().endsWith(".quasar")) {
                        a.href = `index.html?quasar=${encodeURIComponent(cleanItem)}`;
                    } else {
                        a.href = '../' + cleanItem + `?t=${Date.now()}`;
                    }

                    a.innerText = cleanItem;
                    a.className = "cyborg-link";
                    a.setAttribute("target", "_self");

                    li.appendChild(a);
                    list.appendChild(li);
                });

                modalBody.appendChild(list);
            }
        }

        modal.style.display = "flex";
    }
});