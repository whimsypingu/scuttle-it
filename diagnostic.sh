#!/bin/bash

IGNORE_DIRS=("bin" "data" "venv" ".venv" "__pycache__" "tests" "dist" "node_modules" "target" "assets" "docs")

EXTENSIONS=("py" "js" "jsx" "ts" "tsx" "html" "css" "rs")
declare -A COMMENTS=(
    [py]='s/^[[:space:]]*#.*$//'        # #
    [js]='s/^[[:space:]]*\/\/.*$//'     # //
    [jsx]='s/^[[:space:]]*\/\/.*$//'    # //
    [ts]='s/^[[:space:]]*\/\/.*$//'     # //
    [tsx]='s/^[[:space:]]*\/\/.*$//'    # //
    [html]='s/^[[:space:]]*<!--.*$//'   # <!--
    [css]='s/^[[:space:]]*\/\*.*$//'    # /*
    [rs]='s/^[[:space:]]*\/\/.*$//'     # //
)
declare -A LINE_COUNTS
total_lines=0

echo "Pruning ignored folders..."

find_args=()
for dir in "${IGNORE_DIRS[@]}"; do 
    if [ ${#find_args[@]} -gt 0 ]; then 
        find_args+=("-o")
    fi 
    find_args+=("-name" "$dir")
done

echo "Estimating logical lines..."

for ext in "${EXTENSIONS[@]}"; do 
    comment="${COMMENTS[$ext]}"

    while IFS= read -r -d '' file; do 
        lines=$(sed \
            -e "$comment" \
            -e '/^[[:space:]]*$/d' \
            "$file" | wc -l)

        #echo "Counted $lines lines in: $file"

        LINE_COUNTS[$ext]=$((LINE_COUNTS[$ext] + lines))
        total_lines=$((total_lines + lines))

    done < <(
        find . \( "${find_args[@]}" \) -prune -o \
            -type f -name "*.${ext}" -print0
    )
done

echo
echo "------------------------------------"
echo "Lines by file type:"
for ext in "${EXTENSIONS[@]}"; do
    echo ".$ext: ${LINE_COUNTS[$ext]:-0}"
done
echo
echo "Roughly $total_lines logical lines of code."

