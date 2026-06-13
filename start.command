#!/bin/bash
#
# HAVEN ATELIER — Start per Doppelklick (macOS).
# Doppelklick im Finder öffnet ein Terminal, installiert beim ersten Mal die
# Abhängigkeiten und startet die App im Standard-Browser.
#
# Voraussetzung: Node.js (https://nodejs.org, LTS) muss installiert sein.

# In den Ordner dieser Datei wechseln (unabhängig vom Aufrufort).
cd "$(dirname "$0")" || exit 1

clear
echo "──────────────────────────────────────────────"
echo "   HAVEN ATELIER · Ruhe · Raum · Freiheit"
echo "──────────────────────────────────────────────"
echo

# Node prüfen
if ! command -v node >/dev/null 2>&1; then
  echo "✖ Node.js wurde nicht gefunden."
  echo "  Bitte installieren von https://nodejs.org (LTS) und Datei erneut öffnen."
  echo
  read -r -p "Mit Enter schließen…" _
  exit 1
fi
echo "✓ Node.js $(node --version)"

# Abhängigkeiten beim ersten Start installieren
if [ ! -d node_modules ]; then
  echo "→ Erstinstallation der Abhängigkeiten (einmalig, dauert 1–2 Min.)…"
  npm install || { echo "✖ Installation fehlgeschlagen."; read -r -p "Mit Enter schließen…" _; exit 1; }
fi

echo
echo "→ Starte HAVEN ATELIER … der Browser öffnet sich gleich automatisch."
echo "  Zum Beenden dieses Fenster schließen oder Strg+C drücken."
echo

# Dev-Server starten und Browser öffnen
npm run dev -- --open
