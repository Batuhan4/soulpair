#!/bin/bash
# 💘 Soulpair Skill Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Batuhan4/soulpair/master/packages/skill/install.sh | bash

set -e

BASE="https://raw.githubusercontent.com/Batuhan4/soulpair/master/packages/skill"
DIR="$HOME/.pi/agent/skills/soulpair"

echo ""
echo "  💘 Installing Soulpair skill..."
echo ""

mkdir -p "$DIR/prompts"

curl -fsSL "$BASE/SKILL.md"                -o "$DIR/SKILL.md"
curl -fsSL "$BASE/prompts/onboarding.md"   -o "$DIR/prompts/onboarding.md"
curl -fsSL "$BASE/prompts/flirt-gen.md"    -o "$DIR/prompts/flirt-gen.md"
curl -fsSL "$BASE/prompts/matchmaker.md"   -o "$DIR/prompts/matchmaker.md"

echo "  ✅ Installed to $DIR"
echo ""
echo "  Files:"
echo "    $DIR/SKILL.md"
echo "    $DIR/prompts/onboarding.md"
echo "    $DIR/prompts/flirt-gen.md"
echo "    $DIR/prompts/matchmaker.md"
echo ""
echo "  Next: tell your agent '/soulpair-setup' to start 💘"
echo ""
