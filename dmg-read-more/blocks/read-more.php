<?php

/**
 * Functions to register the block and its assets.
 * @package dmg-read-more
 */

/**
 * Registers all block assets so that they can be enqueued through Gutenberg in
 * the corresponding context.
 * @return void
 */
function dmg_read_more_block_init()
{
	if (! function_exists('register_block_type')) {
		return;
	}
	$dir = dirname(__FILE__);

	$index_js = 'read-more/index.js';
	wp_register_script(
		'dmg-read-more-block-editor',
		plugins_url($index_js, __FILE__),
		[
			'wp-blocks',
			'wp-i18n',
			'wp-element',
			'wp-components',
			'wp-api-fetch',
			'wp-block-editor',
			'wp-editor',
		],
		filemtime("{$dir}/{$index_js}")
	);

	$editor_css = 'read-more/editor.css';
	wp_register_style(
		'dmg-read-more-block-editor',
		plugins_url($editor_css, __FILE__),
		[],
		filemtime("{$dir}/{$editor_css}")
	);

	$style_css = 'read-more/style.css';
	wp_register_style(
		'dmg-read-more-block',
		plugins_url($style_css, __FILE__),
		[],
		filemtime("{$dir}/{$style_css}")
	);

	register_block_type('dmg-read-more/read-more', [
		'editor_script' => 'dmg-read-more-block-editor',
		'editor_style'  => 'dmg-read-more-block-editor',
		'style'         => 'dmg-read-more-block',
		'render_callback' => 'dmg_read_more_render_callback',
	]);
}

/**
 * Callback for the block.
 * Returns a link to the post.
 *
 * @param array $attributes Block attributes.
 * @return string HTML to render on front-end.
 */
function dmg_read_more_render_callback($attributes)
{
	if (empty($attributes) || empty($attributes['selectedPostId'])) {
		return ''; // nothing selected
	}

	$post_id = intval($attributes['selectedPostId']);
	$post = get_post($post_id);
	if (! $post) {
		return ''; // invalid id
	}

	$title = esc_html(get_the_title($post));
	$permalink = esc_url(get_permalink($post));

	$prefix = esc_html__('Read more: ', 'dmg-read-more');

	// Render prefix outside the link so the 'Read more' text is not part of the anchor.
	// Output a paragraph with the prefix text followed by the linked title.
	return sprintf(
		'<p class="dmg-read-more" data-post-id="%1$d">%2$s<a href="%3$s">%4$s</a></p>',
		$post_id,
		$prefix,
		$permalink,
		$title
	);
}

add_action('init', 'dmg_read_more_block_init');
