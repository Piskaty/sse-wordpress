<?php
/**
 * Plugin Name: Real-Time  SSE
 * Description: Server-Sent Events for real-time post updates
 * Version: 2.2
 */

if (!defined('ABSPATH')) {
    exit;
}

class SSE_Post_Updates {
    private $updates_option = 'sse_post_updates_queue';
    private $last_check_time;
    private $max_queue_size = 1;

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        add_action('post_updated', array($this, 'store_post_update'), 10, 3);
        add_action('save_post', array($this, 'store_post_update'), 10, 3);
        $this->last_check_time = time();
    }

    public function register_api_endpoints() {
        register_rest_route('sse-updates/v1', '/listen', array(
            'methods' => 'GET',
            'callback' => array($this, 'sse_updates_handler'),
            'permission_callback' => '__return_true'
        ));
    }

    public function store_post_update($post_id, $post_after, $post_before) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        if ($post_after->post_type === 'post' && $post_after->post_status === 'publish') {
            $update = array(
                'id' => $post_id,
                'title' => $post_after->post_title,
                'modified' => $post_after->post_modified,
                'timestamp' => microtime(true)
            );

            $updates_queue = get_option($this->updates_option, array());
            array_push($updates_queue, $update);
            $updates_queue = array_slice($updates_queue, -$this->max_queue_size);

            update_option($this->updates_option, $updates_queue, 'no');
            wp_cache_delete($this->updates_option, 'options');
        }
    }

    public function sse_updates_handler($request) {
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');

        $last_sent_timestamp = 0;

        while (true) {
            wp_cache_delete($this->updates_option, 'options');
            $updates_queue = get_option($this->updates_option, array());
            
            $new_updates = array_filter($updates_queue, function($update) use ($last_sent_timestamp) {
                return $update['timestamp'] > $last_sent_timestamp;
            });

            if (!empty($new_updates)) {
                foreach ($new_updates as $update) {
                    echo "event: update\n";
                    echo "data: " . json_encode($update) . "\n\n";
                    $last_sent_timestamp = max($last_sent_timestamp, $update['timestamp']);
                }
                ob_flush();
                flush();
                $this->last_check_time = time();
            } else {
                if (time() - $this->last_check_time >= 30) {
                    echo "event: ping\n";
                    echo "data: " . json_encode(array('time' => time())) . "\n\n";
                    ob_flush();
                    flush();
                    $this->last_check_time = time();
                }
            }

            if (connection_aborted()) {
                break;
            }

            sleep(0.1);
        }

        exit;
    }
}

$sse_post_updates = new SSE_Post_Updates();

add_action('wp_enqueue_scripts', function() {
    wp_enqueue_script('sse-listener', plugin_dir_url(__FILE__) . 'sse-listener.js', array(), '2.2', true);
    wp_localize_script('sse-listener', 'sseData', array(
        'sseUrl' => rest_url('sse-updates/v1/listen'),
    ));
});