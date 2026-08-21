#!/bin/bash

echo "Calculating line count..."

IGNORE_DIRS=("bin" "data" "venv" ".venv" "__pycache__" "tests" "dist" "node_modules" "target" "assets" "docs")

EXTENSIONS=("py" "js" "ts") # "html" "css" "rs")
declare -A COMMENTS=(
    [py]='s/^[[:space:]]*#.*$//'
    [js]='s/^[[:space:]]*\/\/.*$//'
    [ts]='s/^[[:space:]]*\/\/.*$//'
)

echo "Pruning ignored folders..."

find_args=()
for dir in "${IGNORE_DIRS[@]}"; do 
    if [ ${#find_args[@]} -gt 0 ]; then 
        find_args+=("-o")
    fi 
    find_args+=("-name" "$dir")
done

for ext in "${EXTENSIONS[@]}"; do 
    comment="${COMMENTS[$ext]}"

    while IFS= read -r -d '' file; do 
        lines=$(sed \
            -e 's/^[[:space:]]*//' \
            -e "$comment" \
            -e '/^$/d' \
            "$file" | wc -l)

        echo "Counted $lines lines in: $file"
        total_lines=$((total_lines + lines))

    done < <(
        find . \( "${find_args[@]}" \) -prune -o \
            -type f -name "*.${ext}" -print0
    )
done

echo "------------------------------------"
echo "Roughly $total_lines logical lines of code."

