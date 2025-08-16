# Changelog

## 2025-08-16
- Refactor complet : HTML propre + `style.css` + `app.js`.
- Tout le contenu piloté par `site.config.json` (textes, images, tarifs, liens, horaires, UI).
- Nouveau composant **Avant/Après** :
  - Poignée affichée au-dessus (jamais rognée), gestes mobiles fluides, clavier, double-clic reset.
  - Hauteur fixe et ratio configurables (`ui.compare`).
  - Option `invert` par item pour corriger les paires inversées.
- Icône Instagram data-driven (`brand.instagram_icon`).
- Formulaire en `mailto:` prérempli, sans backend.
