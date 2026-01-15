import shutil
import os

source_dir = r"C:\Users\erubi\.gemini\antigravity\scratch"
dest_dir = r"C:\Users\erubi\Desktop\DentOffice"

# Files/Dirs to copy
include_files = [
    'package.json',
    'package-lock.json',
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

def copy_project():
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        print(f"Created directory: {dest_dir}")
    else:
        print(f"Directory exists: {dest_dir}")

    # Copy individual files
    for file in include_files:
        src = os.path.join(source_dir, file)
        dst = os.path.join(dest_dir, file)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Copied {file}")

    # Copy directories (recursive)
    for folder in include_dirs:
        src_folder = os.path.join(source_dir, folder)
        dst_folder = os.path.join(dest_dir, folder)
        
        if os.path.exists(src_folder):
            if os.path.exists(dst_folder):
                shutil.rmtree(dst_folder) # Clean replace to avoid stale files
            shutil.copytree(src_folder, dst_folder)
            print(f"Copied folder {folder}")

    print(f"\nSUCCESS: Project deployed to {dest_dir}")
    print("Note: node_modules was excluded. Run 'npm install' in the new folder to set up dependencies.")

if __name__ == "__main__":
    copy_project()
