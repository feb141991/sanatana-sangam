import os
import re

def check_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if re.search(r'[^a-zA-Z]t\(', content):
                        # Heuristic: check if t is declared in the file
                        has_decl = (
                            'useLanguage()' in content or 
                            'useTranslation()' in content or 
                            'const { t }' in content or
                            'const t =' in content or
                            'function t(' in content or
                            ' t: ' in content or
                            'import { t }' in content
                        )
                        if not has_decl:
                            print(f"Potential missing 't' in {path}")

if __name__ == "__main__":
    check_files('src')
