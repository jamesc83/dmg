# dmg-read-more

A small WordPress plugin that provides a Gutenberg "Read More" block and a WP-CLI utility to find posts that include the block.

## What it does

- Adds a Gutenberg block `dmg-read-more/read-more` that lets editors search for and attach a post link using InspectorControls.
- Adds the 'dmg-read-more' class to the containing paragraph tag of the link
- Provides two WP-CLI utilities to locate posts that include the block:
- `wp dmg-read-more-search` - uses WP_Query with a commented out section for a wp prepare implementaion
  
## Installation

1. Copy the plugin folder into your site's `wp-content/plugins/` directory.
2. Activate the plugin in the WordPress admin (Plugins → Installed Plugins).
3. WP-CLI commands are available when running `wp` from your site's root if WP-CLI is installed and enabled.

## Block (editor)

- Insert the block named "DMG Read More" (namespace: `dmg-read-more/read-more`) in the block editor.
- Use the Inspector Controls to search for posts (paginated) and select the post you want.
- The block saves the selected post ID and renders a link, prepended with "Read more".

Main files:
- `blocks/read-more/index.js` - editor UI, InspectorControls search and save/render behavior.
- `blocks/read-more/editor.css`, `blocks/read-more/style.css` — styles for editor and front-end.
- `blocks/dmg-read-more.php` - block registration and server-side render callback wiring.

## WP-CLI: `dmg-read-more-search`

Usage examples:

- Basic (default 30-day window):
  wp dmg-read-more-search 
  wp dmg-read-more-search --per_page=50 --page=1

- Wider date range :

  wp dmg-read-more-search --per_page=50 --page=1 --date-after='2000-01-01' --date-before='2030-01-01'



Flags:
- `--per_page` (int) — items per page (default: 100)
- `--page` (int) — page number (default: 1)
- `--date-after` (date string) - start date (defaults to now -30 days)
- `--date-before` (date string) - end date (defaults to now)

Notes:

## Notes 

- We could alternatively add a json option
- I condidered implenting CLI as a class but as it is just one command I left it as a command
- Optionally - Implement a potentially faster DB-backed search using `$wpdb->prepare()` for performance- I have added this commented out
- If adding more blocks to this plugin I would convert read-more.php to a classs and namespace it
- Potentially inplented automated batches on CLI



