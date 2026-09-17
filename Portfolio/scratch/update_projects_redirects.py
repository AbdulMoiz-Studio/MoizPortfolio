import os

slugs = [
    "epic-strategy",
    "brand-design-identity",
    "pixelcraft-studio",
    "creative-studio-ecommerce"
]

redirect_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/work/{slug}">
  <title>Redirecting...</title>
  <script>window.location.replace("/work/{slug}");</script>
</head>
<body>
  <p>Redirecting to <a href="/work/{slug}">/work/{slug}</a>...</p>
</body>
</html>
"""

projects_dir = r"d:\Moiz Profiles\Portfolio\projects"

for slug in slugs:
    content = redirect_template.format(slug=slug)
    flat_file = os.path.join(projects_dir, f"{slug}.html")
    with open(flat_file, "w", encoding="utf-8") as f:
        f.write(content)
        
    nested_dir = os.path.join(projects_dir, slug)
    os.makedirs(nested_dir, exist_ok=True)
    nested_file = os.path.join(nested_dir, "index.html")
    with open(nested_file, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated projects/ redirects to /work/ successfully!")
