
import os

file_path = r"c:/Users/hmyks/Desktop/AURA_Cloud/index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add File Input (Hidden)
# Insert just before </body>
body_end = content.find("</body>")
if body_end != -1:
    input_html = '\n    <!-- Local File Import Input -->\n    <input type="file" id="folder-input" webkitdirectory directory multiple style="display:none">\n'
    content = content[:body_end] + input_html + content[body_end:]

# 2. Add Import Button to Browser Header
# Look for <div class="browser-header"> ... <span>BROWSER</span>
# We'll insert an icon button after the title.

header_start = content.find('<div class="browser-header">')
if header_start != -1:
    # Find the closing div of this header? Or just insert after the span.
    # Content has: <span>BROWSER</span> <div style="flex:1"></div>
    # Let's replace the spacer <div style="flex:1"></div> with:
    # <div style="flex:1"></div> <div class="browser-import" ...> Import </div>
    
    target = '<div style="flex:1"></div>'
    replacement = '''<div style="flex:1"></div>
                <div class="browser-import-btn" title="Import Folder" style="cursor:pointer; margin-right:10px; opacity:0.7;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>'''
    
    # We must find the specific occurrence inside `sample-browser-overlay`.
    # Searching specifically after `#sample-browser-overlay` logic is safer but simple replace might work if unique.
    # The `browser-header` class was just added.
    
    content = content.replace(target, replacement, 1) # Only replace the first one found (UI spacer)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added File Input and Import Button.")
