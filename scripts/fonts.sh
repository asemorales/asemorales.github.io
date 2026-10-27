#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
UP=.fonts-upstream
OUT=public/fonts
mkdir -p "$UP" "$OUT"

fetch() {
  [ -f "$UP/$2" ] || curl -sSLo "$UP/$2" "$1"
}

fetch https://github.com/adobe-fonts/source-serif/releases/download/4.005R/source-serif-4.005_Desktop.zip source-serif.zip
fetch https://raw.githubusercontent.com/googlefonts/dm-mono/main/exports/DMMono-Regular.ttf DMMono-Regular.ttf
unzip -qjo "$UP/source-serif.zip" '*/VAR/SourceSerif4Variable-Roman.ttf' '*/VAR/SourceSerif4Variable-Italic.ttf' -d "$UP"

UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2070-209F,U+20AC,U+2122,U+2190-21FF,U+2200-22FF,U+FEFF,U+FFFD"
BASE="kern,mark,mkmk,ccmp,locl,calt,liga,frac,numr,dnom,sups,subs"

subset() {
  python3 -m fontTools.varLib.instancer "$UP/$1" wght=400:700 "opsz=$4" -q -o "$UP/limited.ttf"
  python3 -m fontTools.subset "$UP/limited.ttf" --output-file="$OUT/$2" --flavor=woff2 \
    --unicodes="$UNICODES" --layout-features="$BASE,$3" \
    --no-hinting --desubroutinize
  echo "$2 $(wc -c <"$OUT/$2") bytes"
}

subset SourceSerif4Variable-Roman.ttf source-serif-4-roman.woff2 smcp,c2sc,lnum,onum,tnum,case 20
subset SourceSerif4Variable-Italic.ttf source-serif-4-italic.woff2 lnum,onum,tnum,case 20
python3 -m fontTools.subset "$UP/DMMono-Regular.ttf" --output-file="$OUT/dm-mono.woff2" --flavor=woff2 \
  --unicodes="$UNICODES" --layout-features="$BASE" --no-hinting
echo "dm-mono.woff2 $(wc -c <"$OUT/dm-mono.woff2") bytes"

OG=src/assets/og
mkdir -p "$OG"
for w in 400 600; do
  python3 -m fontTools.varLib.instancer "$UP/SourceSerif4Variable-Roman.ttf" "wght=$w" opsz=20 -q -o "$UP/limited.ttf"
  python3 -m fontTools.subset "$UP/limited.ttf" --output-file="$OG/source-serif-4-$w.ttf" \
    --unicodes="$UNICODES" --layout-features="$BASE" --no-hinting
  echo "source-serif-4-$w.ttf $(wc -c <"$OG/source-serif-4-$w.ttf") bytes"
done
python3 -m fontTools.varLib.instancer "$UP/SourceSerif4Variable-Italic.ttf" wght=400 opsz=20 -q -o "$UP/limited.ttf"
python3 -m fontTools.subset "$UP/limited.ttf" --output-file="$OG/source-serif-4-400-italic.ttf" \
  --unicodes="$UNICODES" --layout-features="$BASE" --no-hinting
echo "source-serif-4-400-italic.ttf $(wc -c <"$OG/source-serif-4-400-italic.ttf") bytes"
python3 -m fontTools.subset "$UP/DMMono-Regular.ttf" --output-file="$OG/dm-mono.ttf" \
  --unicodes="$UNICODES" --layout-features="$BASE" --no-hinting
echo "dm-mono.ttf $(wc -c <"$OG/dm-mono.ttf") bytes"

unzip -qjo "$UP/source-serif.zip" 'source-serif-4.005_Desktop/LICENSE.md' -d "$UP" && cp "$UP/LICENSE.md" "$OUT/LICENSE-source-serif-4.txt"
fetch https://raw.githubusercontent.com/google/fonts/main/ofl/dmmono/OFL.txt OFL-dm-mono.txt
cp "$UP/OFL-dm-mono.txt" "$OUT/LICENSE-dm-mono.txt"
rm -f "$UP/limited.ttf"
