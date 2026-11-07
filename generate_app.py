import json
import os

with open('data/meals.json', 'r', encoding='utf-8') as f:
    meals_json_str = f.read()

with open('data/strategies.json', 'r', encoding='utf-8') as f:
    strategies_json_str = f.read()

with open('data/supplements.json', 'r', encoding='utf-8') as f:
    supplements_json_str = f.read()

app_template = """<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>ZAP FIT™ Chef Didi | AI-Powered Post-Workout Nutrition</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="/logo-mark.png?v=3">
  <link rel="apple-touch-icon" href="/logo-mark.png?v=3">
  <link rel="stylesheet" href="/src/index.css?v=3">
  <style>
    /* Dish Plate Artwork Graphic */
    .plate-art-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: 
        radial-gradient(circle at 35% 35%, #FAF0DF 0 16%, transparent 17%),
        radial-gradient(circle at 65% 35%, #708050 0 18%, transparent 19%),
        radial-gradient(circle at 45% 65%, #C05020 0 18%, transparent 19%),
        radial-gradient(circle at 50% 50%, #F2E5CE 0 58%, #FAF0DF 59% 68%, #D06828 69% 70%, transparent 71%);
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="modalsContainer"></div>
  <div id="zapToast" style="display: none; position: fixed; bottom: 24px; right: 24px; z-index: 9999;"></div>

  <!-- Static Meal, Strategy & Supplement Catalog (Zero API Keys or Credentials in Frontend) -->
  <script>
    window.ZAP_MEALS = __MEALS_DATA__;
    window.ZAP_STRATEGIES = __STRATEGIES_DATA__;
    window.ZAP_SUPPLEMENTS = __SUPPLEMENTS_DATA__;
  </script>

  <!-- Firebase Auth SDK for Google OAuth Popup (Initialized on demand via /api/config) -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>

  <!-- Modern Vanilla Web App Engine (Communicates via Backend /api/* Endpoints) -->
  <script src="/src/standalone_app.js?v=3"></script>
</body>
</html>
"""

output = app_template.replace('__MEALS_DATA__', meals_json_str)
output = output.replace('__STRATEGIES_DATA__', strategies_json_str)
output = output.replace('__SUPPLEMENTS_DATA__', supplements_json_str)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(output)

for route_dir in ['didi', 'deede']:
    os.makedirs(route_dir, exist_ok=True)
    with open(os.path.join(route_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(output)

print("Generated index.html, didi/index.html, and deede/index.html with zero credentials exposed in frontend.")

