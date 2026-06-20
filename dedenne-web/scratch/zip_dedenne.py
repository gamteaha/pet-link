import os
import zipfile

def zip_directory(folder_path, zip_path):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # Exclude venv and __pycache__
            dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__']]
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(folder_path))
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    zip_directory('c:/antigravity/pet-link/dedenne', 'c:/antigravity/pet-link/dedenne-web/public/releases/dedenne-desktop-pet.zip')
    print("Done zipping dedenne.")
