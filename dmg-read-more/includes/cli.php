<?php

/**
 * WP-CLI: dmg-read-more-search
 *
 * Minimal command to search posts, optionally filtered by a date range.
 *
 * Usage:
 *  wp dmg-read-more-search --date-before="2025-10-01" --date-after="2025-01-01" --per_page=10 --page=1 
 */

if (!defined('WP_CLI') && WP_CLI) {
    return;
}

/**
 * Search posts with optional date range.
 *
 * @param array $args args (unused).
 * @param array $assoc_args Associative args (flags).
 */


class DMG_Read_More_Search
{

    public function __invoke($args, $assoc_args)
    {
        $per_page = !empty($assoc_args['per-page']) ? intval($assoc_args['per_page']) : 100;
        $page = !empty($assoc_args['page']) ? intval($assoc_args['page']) : 1;
        $date_before = !empty($assoc_args['date-before']) ? $assoc_args['date-before'] : date('Y-m-d', strtotime('+1 days'));
        $date_after = !empty($assoc_args['date-after']) ? $assoc_args['date-after'] : date('Y-m-d', strtotime('-30 days'));



        //WP_Query implementation 
        $date_query = [];
        if (! empty($date_after)) {
            $date_query['after'] = $date_after;
        }
        if (! empty($date_before)) {
            $date_query['before'] = $date_before;
        }

        $query_args = array(
            's'               => 'wp:dmg-read-more/read-more',
            'posts_per_page'  => $per_page,
            'paged'           => $page,
            'post_type'       => 'post',
            'post_status'     => 'publish',
            'fields'          => 'ids',// only get post IDs to improve performance
        );
        $date_query = [];
        if ($date_before) {
            $date_query['before'] = date('Y-m-d', strtotime($date_before));
        }
        if ($date_after) {
            $date_query['after'] = date('Y-m-d', strtotime($date_after));
        }
        if (!empty($date_query)) {
            $query_args['date_query'] = array($date_query);
        }

        if (! empty($date_query)) {
            $query_args['date_query'] = array($date_query);
        }
        $query = new WP_Query($query_args);

        //potentially improve performance by caching results for repeated queries
        $key = 'dmg_read_more' . md5( wp_json_encode( $query_args ) );
        set_transient( $key, $query->posts, HOUR_IN_SECONDS );

        if (empty($query->posts)) {
            WP_CLI::log('No posts found.');
            WP_CLI::log('No posts found.');
            return;
        }

        // Output IDs, one per line.
        foreach ($query->posts as $post_id) {
            WP_CLI::line($post_id);
        }
        return;


        // Optional performance optimization: Change to use wpdb prepare for performance reasons
        /* 
        global $wpdb;
        $needle = '%' . $wpdb->esc_like('<!-- wp:dmg-read-more/read-more') . '%';
        $where = "post_type = 'post' AND post_status = 'publish' AND post_content LIKE %s";
        $params = array($needle);
        
        if ($date_after) {
            $after_dt = date('Y-m-d H:i:s', strtotime($date_after));
            $where   .= ' AND post_date >= %s';
            $params[] = $after_dt;
        }
        if ($date_before) {
            $before_dt = date('Y-m-d H:i:s', strtotime($date_before));
            $where    .= ' AND post_date <= %s';
            $params[] = $before_dt;
        }

        $order_by = 'ORDER BY post_date DESC';
        $limit  = intval($per_page);
        $offset = intval(($page - 1) * $per_page);

        // Append limit/offset params last to match the %d placeholders.
        $params = array_merge($params, array($limit, $offset));
        $sql = $wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE {$where} {$order_by} LIMIT %d OFFSET %d", $params);

        $rows = $wpdb->get_results($sql, ARRAY_A);

        if (empty($rows)) {
            WP_CLI::line('No posts found.');
            return;
        }
        // Output the matching post IDs to stdout (one per line)
        foreach ($rows as $r) {
            WP_CLI::line($r['ID']);
        }
        return;
        */
    }
}

WP_CLI::add_command('dmg-read-more-search', 'DMG_Read_More_Search');
