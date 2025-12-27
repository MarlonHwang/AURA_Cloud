const fs = require('fs');
const path = require('path');

// 1. Append CSS to index.html
const htmlPath = path.join(process.cwd(), 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

const tabsCss = `
        /* ==================== EDIT DOCK TABS STYLES ==================== */
        .detail-editor {
            display: flex;
            flex-direction: column;
            background: #141418;
        }

        .detail-editor-header {
            height: 32px;
            background: #202228;
            border-bottom: 1px solid #2A2D33;
            display: flex;
            align-items: center;
            padding: 0 10px;
            flex-shrink: 0;
        }

        .detail-editor-title {
            font-size: 11px;
            font-weight: 700;
            color: #606570;
            text-transform: uppercase;
            margin-right: 20px;
            letter-spacing: 1px;
        }

        .edit-dock-tabs {
            display: flex;
            gap: 2px;
            height: 100%;
        }

        .edit-dock-tab {
            background: transparent;
            border: none;
            color: #888;
            padding: 0 16px;
            height: 100%;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            text-transform: uppercase;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
            outline: none;
        }

        .edit-dock-tab:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }

        .edit-dock-tab.active {
            color: #4DFFFF; /* Neon Cyan */
            border-bottom: 2px solid #4DFFFF;
            background: rgba(77, 255, 255, 0.05);
            text-shadow: 0 0 8px rgba(77, 255, 255, 0.4);
        }

        .edit-dock-panels-container {
            flex: 1;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .edit-dock-panel {
            display: none;
            flex: 1;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .edit-dock-panel.active {
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Layout fixes for inner panels */
        .step-seq-tab-container {
            flex: 1;
            overflow: hidden;
        }
        
        .editor-content {
            flex: 1;
            display: flex;
            overflow: hidden;
            height: 100%;
        }
        
        .piano-roll {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #141418;
            border-left: 1px solid #2A2D33;
        }
        
        .mixer-wrapper {
            flex: 1;
            overflow-x: auto;
            overflow-y: hidden;
            background: #141418;
            padding: 20px;
            display: flex;
            align-items: flex-start;
        }
        
        .mixer-content {
            display: flex;
            gap: 4px;
            height: 100%;
        }
`;

const styleClose = htmlContent.lastIndexOf('</style>');
if (styleClose === -1) {
    console.error('No </style> tag found');
    process.exit(1);
}

const finalHtml = htmlContent.substring(0, styleClose) + tabsCss + htmlContent.substring(styleClose);
fs.writeFileSync(htmlPath, finalHtml);
console.log('Successfully appended Tabs CSS');

// 2. Append JS to main.ts
const tsPath = path.join(process.cwd(), 'src/main.ts');
let tsContent = fs.readFileSync(tsPath, 'utf8');

const tabsJs = `

// ==================== EDIT DOCK TAB SWITCHING ====================
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.edit-dock-tab');
    const panels = document.querySelectorAll('.edit-dock-panel');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // 1. Update Tab UI
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 2. Switch Panel
            // Get panel name from text or data attribute if mapped. 
            // Here we assume index matching or data-panel matching.
            // HTML Structure: Tabs are [Step Seq, Piano Roll, Mixer, Audio, Sampler]
            // Panels are [step-seq, piano-roll, mixer, audio, sampler]
            
            // Let's rely on data-panel mapping if possible, or index.
            // But buttons don't have data-target. Let's use index.
            
            panels.forEach(p => p.classList.remove('active'));
            
            // Note: There might be more tabs than panels or vice versa?
            // "Audio" and "Sampler" are inactive/placeholders.
            
            const panelName = tab.textContent.trim();
            let targetPanelId = '';
            
            if (panelName === 'Step Seq') targetPanelId = 'step-seq';
            else if (panelName === 'Piano Roll') targetPanelId = 'piano-roll';
            else if (panelName === 'Mixer') targetPanelId = 'mixer';
            else if (panelName === 'Audio') targetPanelId = 'audio';
            else if (panelName === 'Sampler') targetPanelId = 'sampler';
            
            if (targetPanelId) {
                const targetPanel = document.querySelector(\`.edit-dock-panel[data-panel="\${targetPanelId}"]\`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    console.log('Switched to:', targetPanelId);
                }
            }
        });
    });
});
`;

fs.writeFileSync(tsPath, tsContent + tabsJs);
console.log('Successfully appended Tabs JS');
