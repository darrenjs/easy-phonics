#!/usr/bin/bash

set -eu

for filename in $@ ;
do
    name="${filename%.*}"
    ext="${filename##*.}"


    magick ${filename} -resize 800x -colors 32 ${name}-800_32.${ext}
done
