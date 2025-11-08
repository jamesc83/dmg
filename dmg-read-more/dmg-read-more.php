<?php
/**
 * Plugin Name:     Dmg Read More
 * Author:          James Corkhill
 * Text Domain:     dmg-read-more
 * Domain Path:     /languages
 * Version:         0.1.0
 *
 * @package         Dmg_Read_More
 */


$read_more_block= plugin_dir_path( __FILE__ ) . 'blocks/read-more.php';
if ( file_exists( $read_more_block) ) {
	require_once $read_more_block;
}

// Load WP-CLI commands when available
$cli = plugin_dir_path( __FILE__ ) . 'includes/cli.php';
if ( file_exists( $cli ) ) {
	require_once $cli;
}
