import os

file_path = r"C:\Users\hmyks\Desktop\AURA_Cloud\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<header class="header">'
end_marker = '</header>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker)
    
    # Extract the block to be removed for verification (optional)
    old_block = content[start_idx:end_idx]
    print(f"Found block of length {len(old_block)}")
    
    new_content = content[:start_idx] + '<!-- Header React Root -->\n    <div id="header-root"></div>' + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced legacy header with #header-root")
else:
    print("Could not find header block")
