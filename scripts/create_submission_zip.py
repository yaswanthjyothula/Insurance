import os
import zipfile

EXCLUDE_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    ".next",
    "__pycache__",
    ".pytest_cache",
    ".gemini",
    "brain",
    ".idea",
    ".vscode",
}

EXCLUDE_EXTS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".log",
}

EXCLUDE_FILES = {
    ".DS_Store",
    "submission.zip",
    "project.zip",
    "Insurance.zip",
}

def create_zip(source_dir, output_zip):
    source_dir = os.path.abspath(source_dir)
    print(f"Creating submission zip from {source_dir} -> {output_zip}")
    
    file_count = 0
    total_uncompressed = 0

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                ext = os.path.splitext(file)[1].lower()
                if ext in EXCLUDE_EXTS:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)

                # Skip if any path part is in EXCLUDE_DIRS
                parts = rel_path.split(os.sep)
                if any(p in EXCLUDE_DIRS for p in parts):
                    continue

                zipf.write(full_path, rel_path)
                file_count += 1
                total_uncompressed += os.path.getsize(full_path)

    zip_size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"Successfully created: {output_zip}")
    print(f"Total files packed: {file_count}")
    print(f"Total uncompressed: {total_uncompressed / (1024 * 1024):.2f} MB")
    print(f"Compressed Zip size: {zip_size_mb:.2f} MB")

if __name__ == "__main__":
    create_zip(".", "LifeSure_AI_Hackathon_Submission.zip")
