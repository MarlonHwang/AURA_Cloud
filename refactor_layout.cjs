const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

function extractBlock(startMarker, endMarker, content, startIndex = 0) {
    const startIdx = content.indexOf(startMarker, startIndex);
    if (startIdx === -1) return null;
    const endIdx = content.indexOf(endMarker, startIdx);
    if (endIdx === -1) return null;
    const fullEndIdx = endIdx + endMarker.length;
    return {
        start: startIdx,
        end: fullEndIdx,
        text: content.substring(startIdx, fullEndIdx)
    };
}

const header = extractBlock('<header class="header">', '</header>', content);
const resource = extractBlock('<aside class="resource-browser">', '</aside>', content);
const timeline = extractBlock('<section class="timeline">', '</section>', content);
const detail = extractBlock('<section class="detail-editor">', '</section>', content);
const copilot = extractBlock('<aside class="ai-copilot">', '</aside>', content);

if (!header || !resource || !timeline || !detail || !copilot) {
    console.error('Failed to find all blocks');
    if (!header) console.log('Header missing');
    if (!resource) console.log('Resource missing');
    if (!timeline) console.log('Timeline missing');
    if (!detail) console.log('Detail missing');
    if (!copilot) console.log('Copilot missing');
    process.exit(1);
}

const appStart = content.indexOf('<div class="app-container">');
const appEndMarker = '<!-- Loading Spinner -->';
const appEndIdx = content.indexOf(appEndMarker);
if (appEndIdx === -1) {
    console.error('Could not find Loading Spinner marker');
    process.exit(1);
}

// Find the closing div of app-container before the loader
const containerClose = content.lastIndexOf('</div>', appEndIdx);

const newHtml = `
    <div class="app-container app-flex-layout" id="appContainer">
        ${header.text}
        
        <div class="layout-body" id="layoutBody">
            <div class="layout-panel left-panel" id="leftPanel">
                ${resource.text}
            </div>
            
            <div class="resizer-v" id="resizerLeft"></div>
            
            <div class="layout-panel center-panel" id="centerPanel">
                ${timeline.text}
            </div>
            
            <div class="resizer-v" id="resizerRight"></div>
            
            <div class="layout-panel right-panel" id="rightPanel">
                ${copilot.text}
            </div>
        </div>
        
        <div class="resizer-h" id="resizerBottom"></div>
        
        <div class="layout-panel bottom-panel" id="bottomPanel">
            ${detail.text}
        </div>
    </div>
`;

const before = content.substring(0, appStart);
const after = content.substring(containerClose + 6);

const final = before + newHtml + after;

fs.writeFileSync('index.html', final);
console.log('Successfully refactored index.html');
