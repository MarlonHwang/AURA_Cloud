const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const css = `
        /* ==================== RESIZABLE 5-PANEL LAYOUT STYLES ==================== */
        html, body {
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }

        .app-flex-layout {
            display: flex !important;
            flex-direction: column !important;
            height: 100vh !important;
            overflow: hidden !important;
            width: 100vw !important;
            grid-template-rows: none !important;
            grid-template-columns: none !important;
        }

        .layout-body {
            flex: 1;
            display: flex;
            flex-direction: row;
            overflow: hidden;
            height: 100%;
            min-height: 0;
        }

        .layout-panel {
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .layout-panel.left-panel {
            width: 280px;
            flex-shrink: 0;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .layout-panel.center-panel {
            flex: 1;
            min-width: 0;
        }

        .layout-panel.right-panel {
            width: 300px;
            flex-shrink: 0;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .layout-panel.bottom-panel {
            height: 300px;
            flex-shrink: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            background: #1A1A20;
            display: flex;
            flex-direction: row;
        }

        /* Resizers */
        .resizer-v {
            width: 5px;
            background: #121212;
            cursor: col-resize;
            flex-shrink: 0;
            z-index: 999;
            transition: background 0.2s;
        }

        .resizer-v:hover, .resizer-v.resizing {
            background: #4DFFFF;
            box-shadow: 0 0 10px rgba(77, 255, 255, 0.5);
        }

        .resizer-h {
            height: 5px;
            background: #121212;
            cursor: row-resize;
            flex-shrink: 0;
            z-index: 999;
            transition: background 0.2s;
        }

        .resizer-h:hover, .resizer-h.resizing {
            background: #4DFFFF;
            box-shadow: 0 0 10px rgba(77, 255, 255, 0.5);
        }

        /* Overrides to adapt existing components */
        .detail-editor {
            height: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            border: none !important;
        }

        .resource-browser {
            width: 100% !important;
            height: 100% !important;
            border-right: none !important;
        }
        
        .ai-copilot {
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
        }
        
        /* Make sure timeline takes full height */
        .timeline {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .timeline-body {
            flex: 1;
            overflow: hidden;
        }
`;

const styleClose = content.lastIndexOf('</style>');
if (styleClose === -1) {
    console.error('No </style> tag found');
    process.exit(1);
}

const final = content.substring(0, styleClose) + css + content.substring(styleClose);
fs.writeFileSync('index.html', final);
console.log('Successfully appended CSS');
