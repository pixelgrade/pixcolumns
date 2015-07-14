<?php
/**
 Plugin Name: PixColumns
 Plugin URI: 
 Description: Play with columns the easy way.
 Version: 0.0.1
 Author: Vlad Olaru, George Olaru
 Author URI: https://pixelgrade.com
 License: GPLv2 or later
*/

class PixColumns {

	/**
	 * Handles initializing this class and returning the singleton instance after it's been cached.
	 *
	 * @return null|PixColumns
	 */
	public static function get_instance() {
		// Store the instance locally to avoid private static replication
		static $instance = null;

		if ( null === $instance ) {
			$instance = new self();
			self::_setup_plugin();
		}

		return $instance;
	}

	/**
	 * An empty constructor
	 */
	public function __construct() { /* Purposely do nothing here */ }

	/**
	 * Handles registering hooks that initialize this plugin.
	 */
	public static function _setup_plugin() {
		add_filter( 'mce_external_plugins', array( __CLASS__, 'mce_external_plugins' ) );
		add_filter( 'mce_buttons_2', array( __CLASS__, 'mce_buttons_2' ) );
		add_filter( 'content_save_pre', array( __CLASS__, 'content_save_pre' ), 20 );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'register_admin_assets' ) );

		add_filter( 'mce_css', array( __CLASS__, 'tiny_mce_css' ) );
	}

	/**
	 * Registers and enqueues admin-specific styles.
	 */
	public static function register_admin_assets() {
		wp_enqueue_style( 'pixcolumns-style', plugin_dir_url( __FILE__ ) . 'assets/css/admin.css' );

		wp_enqueue_script( 'pixcolumns-resizingcell', plugin_dir_url( __FILE__ ) . 'assets/js/resizingCell.js', array('jquery') );

	} // end register_admin_assets

	/**
	 * Registers and enqueues TinyMCE styles.
	 */
	public static function tiny_mce_css( $mce_css ) {
		if ( ! empty( $mce_css ) )
			$mce_css .= ',';

		$mce_css .= plugins_url( 'assets/css/editor.css', __FILE__ );

		return $mce_css;

	} // end register_admin_assets

	/**
	 * Initialize TinyMCE table plugin and custom TinyMCE plugin
	 *
	 * @param array $plugin_array Array of TinyMCE plugins
	 * @return array Array of TinyMCE plugins
	 */
	public static function mce_external_plugins( $plugin_array ) {
//		global $tinymce_version;
//		$variant = ( defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ) ? '' : '.min';
		$variant = '';

		$plugin_array['pixcolumns'] = plugin_dir_url( __FILE__ ) . 'assets/tinymce-pixcolumns/plugin' . $variant . '.js';

		return $plugin_array;
	}

	/**
	 * Add TinyMCE columns control buttons
	 *
	 * @param array $buttons Buttons for the second row
	 * @return array Buttons for the second row
	 */
	public static function mce_buttons_2( $buttons ) {
//		global $tinymce_version;

		// in case someone is manipulating other buttons, drop columns controls at the end of the row
		if ( ! $pos = array_search( 'undo', $buttons ) ) {
			array_push( $buttons, 'pixcolumns' );
			return $buttons;
		}

		$buttons = array_merge( array_slice( $buttons, 0, $pos ), array( 'pixcolumns' ), array_slice( $buttons, $pos ) );

		return $buttons;
	}

	/**
	 * Fixes weirdness resulting from wpautop and formatting clean up not built for tables
	 *
	 * @param string $content Editor content before WordPress massaging
	 * @return string Editor content before WordPress massaging
	 */
	public static function content_save_pre( $content ) {
		if ( false !== strpos( $content, '<table' ) ) {
			// paragraphed content inside of a td requires first paragraph to have extra line breaks (or else autop breaks)
			$content  = preg_replace( "/<td([^>]*)>(.+\r?\n\r?\n)/m", "<td$1>\n\n$2", $content );

			// make sure there's space around the table
			if ( substr( $content, -8 ) == '</table>' ) {
				$content .= "\n<br />";
			}
		}
		
		return $content;
	}
}

PixColumns::get_instance();