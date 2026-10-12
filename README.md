# Iron & Oil Garage

Themenseite für eine (fiktive) Motorrad-Werkstatt, rein statisch (HTML, CSS, JavaScript). Teil einer Reihe kleiner Themen-Websites.

**Live:** https://intingtion.github.io/motorrad-garage/

## Gestaltungsidee
- Farbwelt: dunkler Stahl, Rost-Orange, Warngelb
- Schrift: Oswald (Überschriften), Barlow (Text), lokal eingebunden unter `assets/fonts/` (SIL Open Font License), keine Verbindung zu Google-Servern
- Signature-Animation: Funkenflug im Hero (Canvas-Partikel mit Schwerkraft und Abprallen), der Schleifpunkt folgt der Maus
- Weitere Details: Metallplatten mit Nieten, Warnstreifen, Vorher/Nachher-Regler mit selbstgezeichnetem Motorrad (SVG), Film-Grain

## Inhalt
Navigation, Hero, Werkstatt, Statistik, Leistungen, Vorher/Nachher, Ablauf, Öffnungszeiten, FAQ, Kontakt. Firma, Preise und Zahlen sind frei erfunden.

## Konfiguration
Alles Inhaltliche und Farbliche steht in `config.json`:
- `meta`: Titel, Beschreibung, Sprache
- `theme`: Farben und Schriften (werden als CSS-Variablen gesetzt)
- `effects`: Funken, Grain, Cursor-Glow einzeln ein-/ausschalten
- `sections`: pro Sektion `enabled` plus Inhalte; die Reihenfolge in der Datei bestimmt die Reihenfolge auf der Seite. Mit `nav` bekommt eine Sektion einen Menüpunkt.

## Lokal starten
`config.json` wird per `fetch` geladen, daher einen kleinen Webserver verwenden:

```
npx http-server -p 8000 -c-1
```

Dann http://localhost:8000 öffnen.
