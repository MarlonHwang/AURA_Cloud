const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/main.ts');
let content = fs.readFileSync(filePath, 'utf8');

const resizeLogic = `

// ==================== LAYOUT RESIZING LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const bottomPanel = document.getElementById('bottomPanel');
    const resizerLeft = document.getElementById('resizerLeft');
    const resizerRight = document.getElementById('resizerRight');
    const resizerBottom = document.getElementById('resizerBottom');

    // Load Saved State
    const savedConfig = JSON.parse(localStorage.getItem('aura-layout-config') || '{}');
    if (savedConfig.leftWidth && leftPanel) leftPanel.style.width = savedConfig.leftWidth + 'px';
    if (savedConfig.rightWidth && rightPanel) rightPanel.style.width = savedConfig.rightWidth + 'px';
    if (savedConfig.bottomHeight && bottomPanel) bottomPanel.style.height = savedConfig.bottomHeight + 'px';

    // Save State Helper
    const saveState = () => {
        const config = {
            leftWidth: leftPanel ? parseInt(leftPanel.style.width) : 280,
            rightWidth: rightPanel ? parseInt(rightPanel.style.width) : 300,
            bottomHeight: bottomPanel ? parseInt(bottomPanel.style.height) : 300
        };
        localStorage.setItem('aura-layout-config', JSON.stringify(config));
    };

    // Resizer Handler Factory
    const createResizer = (resizer, direction, target, isRightSide = false) => {
        if (!resizer || !target) return;

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizer.classList.add('resizing');
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = target.offsetWidth;
            const startHeight = target.offsetHeight;

            const onMouseMove = (moveEvent) => {
                if (direction === 'horizontal') {
                    // Vertical Resizer (Changes Width)
                    let newWidth;
                    if (isRightSide) {
                         // For right panel, moving left (negative delta) increases width
                        newWidth = startWidth - (moveEvent.clientX - startX);
                    } else {
                        newWidth = startWidth + (moveEvent.clientX - startX);
                    }
                    if (newWidth > 150 && newWidth < 600) { // Min/Max constraints
                        target.style.width = newWidth + 'px';
                    }
                } else {
                    // Horizontal Resizer (Changes Height) - Bottom Panel
                    // Dragging up (negative delta) increases height
                    const newHeight = startHeight - (moveEvent.clientY - startY);
                    if (newHeight > 100 && newHeight < 800) {
                        target.style.height = newHeight + 'px';
                    }
                }
            };

            const onMouseUp = () => {
                resizer.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                saveState();
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    };

    createResizer(resizerLeft, 'horizontal', leftPanel, false);
    createResizer(resizerRight, 'horizontal', rightPanel, true);
    createResizer(resizerBottom, 'vertical', bottomPanel, false); // Vertical movement changes height
});
`;

fs.writeFileSync(filePath, content + resizeLogic);
console.log('Successfully appended Resizer JS');
