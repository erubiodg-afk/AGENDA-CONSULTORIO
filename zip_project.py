import zipfile
import os

source_dir = r"C:\Users\erubi\.gemini\antigravity\scratch"
output_filename = r"C:\Users\erubi\.gemini\antigravity\brain\9de9dab5-648f-485e-9a82-9a9af0a252c5\DentOffice_Project.zip"

include_files = [
    'package.json',
    'vite.config.js',
    'index.html',
    'postcss.config.js',
    'tailwind.config.js',
    'jsconfig.json'
]

include_dirs = [
    'src',
    'public'
]

with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add files
    for file in include_files:
        path = os.path.join(source_dir, file)
        if os.path.exists(path):
            zipf.write(path, file)
            print(f"Added {file}")
            
    # Add directories
    for folder in include_dirs:
        folder_path = os.path.join(source_dir, folder)
        if os.path.exists(folder_path):
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
                    print(f"Added {arcname}")

print(f"Project zipped to {output_filename}")
