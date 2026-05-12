import sys

def fix_id_extensions():
    with open('idExtensions.ts', 'r') as f:
        content = f.read()
    
    qrcode_block = '  {\n    key: "qrcode",\n    label: "QR Code",\n    helper: "Creates a QR code field with structured data support",\n  },\n'
    
    # Remove all occurrences of the block
    content = content.replace(qrcode_block, '')
    
    # Find the end of FIELD_TYPES array
    marker = '].map(ft => ({ ...ft, isFieldType: true }));'
    if marker not in content:
        print(f"Error: marker '{marker}' not found")
        return
        
    parts = content.split(marker)
    field_types_part = parts[0].rstrip()
    
    # Remove trailing comma if exists to normalize
    if field_types_part.endswith(','):
        field_types_part = field_types_part[:-1].rstrip()
    
    new_content = field_types_part + ',\n' + qrcode_block + marker + parts[1]
    
    with open('idExtensions.ts', 'w') as f:
        f.write(new_content)

if __name__ == "__main__":
    fix_id_extensions()
