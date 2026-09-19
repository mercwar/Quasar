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

            star.appendChild(ringB);
            star.appendChild(ringC);

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
                <div class="modal-header" style="display: flex; align-items: center;">
                    <button id="modal-title-copy" class="cyborg-copy-btn" style="margin-right: 8px; cursor: pointer; background: transparent; border: none; padding: 0; font-size: inherit;" title="Copy window title path">🗃️</button>
                    <span id="modal-title">CYBORG PAYLOAD</span>
                    <button id="modal-close" style="margin-left: auto;">&times;</button>
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
    const titleCopyBtn = document.getElementById("modal-title-copy");

    // Assign text content values
    modalTitle.innerText = `${filename}`;
    modalBody.innerHTML = "";

    // Title copy button event tracking logic
    titleCopyBtn.onclick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(filename).then(() => {
            const originalHtml = titleCopyBtn.innerHTML;
            titleCopyBtn.innerHTML = "✔️";
            setTimeout(() => {
                titleCopyBtn.innerHTML = originalHtml;
            }, 1200);
        }).catch(err => {
            console.error("Failed to copy window path: ", err);
        });
    };

    if (error) {
        modalBody.innerHTML = `<div class="modal-error">[AVIS ERROR]: Failed to load asset stream (${error})</div>`;
    } else {
        const entries = rawContent.split(/[\r\n,]+/).map(item => sanitizePath(item)).filter(Boolean);

        if (entries.length === 0) {
            modalBody.innerHTML = `<div class="modal-empty">No target payload assets listed.</div>`;
        } else {
            const list = document.createElement("ul");
            list.className = "cyborg-file-list";
            list.style.listStyle = "none"; // Clears default list bullets if needed
            list.style.padding = "0";

            entries.forEach(item => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                const copyBtn = document.createElement("button");
                
                const cleanItem = sanitizePath(item);
                
                if (cleanItem.toLowerCase().endsWith(".quasar")) {
                    a.href = `index.html?quasar=${encodeURIComponent(cleanItem)}`;
                } else {
                    a.href = '../' + cleanItem + `?t=${Date.now()}`;
                }

                a.innerText = cleanItem;
                a.className = "cyborg-link";
                a.setAttribute("target", "_self");

                // Forces button and text to stay horizontally locked on the same line
                li.style.display = "flex";
                li.style.alignItems = "center";
                li.style.whiteSpace = "nowrap"; 

                // Configure copy button with a completely transparent background styling
                copyBtn.className = "cyborg-copy-btn";
                copyBtn.innerHTML = "🗃️"; 
                copyBtn.style.background = "transparent";
                copyBtn.style.border = "none";
                copyBtn.style.padding = "0";
                copyBtn.style.marginRight = "8px";
                copyBtn.style.cursor = "pointer";
                copyBtn.style.fontSize = "inherit";
                copyBtn.style.flexShrink = "0"; // Prevents button from squishing on tiny windows
                copyBtn.title = "Copy address to clipboard";
                
                copyBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(cleanItem).then(() => {
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = "✔️";
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                        }, 1200);
                    }).catch(err => {
                        console.error("Failed to copy address: ", err);
                    });
                });

                // Layout order execution
                li.appendChild(copyBtn);
                li.appendChild(a);
                list.appendChild(li);
            });

            modalBody.appendChild(list);
        }
    }

    modal.style.display = "flex";
}

});