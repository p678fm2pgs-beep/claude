# NEBENBEFUNDE (nur dokumentiert, NICHT in diesem Fix geändert)

Beim Material-Fix aufgefallen — bewusst separat zu behandeln (Fokus halten):

1. **Alt-Projekte mit doppelten Boden-/Decken-Auswahlen.** Vor dem Fix konnten mehrere
   Boden-/Decken-Auswahlen akkumulieren; die Kalkulation zählt jede als volle Fläche
   (Doppelzählung). Neu-Auswahlen ersetzen jetzt (kein Neuauftreten), aber bereits gespeicherte
   Projekte könnten Altbestände enthalten. → Vorschlag: einmaliger Migrations-/Bereinigungsschritt
   (pro Raum/Variante nur die letzte Boden-/Decken-Auswahl behalten).

2. **3D-Tür-Bauteil (Erweiterung 5, Teil 2):** Türblatt/Anschlagrichtung sind noch vereinfacht
   (kein Drehflügel-Winkel, keine Klinke). → Teil des offenen V6-Feinschliffs.

3. **3D-Decke nicht dargestellt** (offener Orbit-Blick von oben). Für Voute/Decken-Material wäre eine
   ein-/ausblendbare Decke sinnvoll. → Erweiterung 5, Teil 2 (V7/V8).

4. **`chosen-materials`-Liste zeigt weiterhin alle Wand-Auswahlen** (pro Wand), was bei vielen
   Wänden unübersichtlich werden kann. → reine UX-Politur, kein Funktionsfehler.
