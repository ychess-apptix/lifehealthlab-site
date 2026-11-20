<?php
/**
 * Healthy Life Laboratory block theme.
 *
 * Content is edited with core blocks; the design (assets/css/site.css),
 * motion (assets/js/site.js) and decorative SVGs (decor/*.html, rendered by
 * the lhl/decor block) are owned by the theme.
 */

defined( 'ABSPATH' ) || exit;

define( 'LHL_VER', wp_get_theme()->get( 'Version' ) );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'disable-layout-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'post-thumbnails' );
	remove_theme_support( 'core-block-patterns' );
	add_editor_style( array( lhl_fonts_url(), 'assets/css/site.css', 'assets/css/editor.css' ) );
	add_post_type_support( 'page', 'excerpt' );
} );

function lhl_fonts_url() {
	return 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap';
}

/* ---------- front-end assets ---------- */
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'lhl-fonts', lhl_fonts_url(), array(), null );
	wp_enqueue_style( 'lhl-site', get_theme_file_uri( 'assets/css/site.css' ), array( 'lhl-fonts' ), LHL_VER );
	wp_enqueue_script( 'lhl-site', get_theme_file_uri( 'assets/js/site.js' ), array(), LHL_VER, array( 'in_footer' => true, 'strategy' => 'defer' ) );
	wp_localize_script( 'lhl-site', 'LHL', array( 'thanks' => home_url( '/contact/thanks/' ) ) );
	wp_dequeue_style( 'wp-block-library-theme' );
	wp_dequeue_style( 'classic-theme-styles' );
} );

add_action( 'wp_head', function () {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
	echo '<meta name="theme-color" content="#fbfaf6" media="(prefers-color-scheme: light)">' . "\n";
	echo '<meta name="theme-color" content="#0f1822" media="(prefers-color-scheme: dark)">' . "\n";
}, 1 );

/* No emoji script. */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );

/* ---------- titles, description, OGP ---------- */
add_filter( 'document_title_separator', function () { return '｜'; } );
add_filter( 'document_title', function ( $title ) {
	return str_replace( ' ｜ ', '｜', $title );
} );
add_filter( 'document_title_parts', function ( $parts ) {
	unset( $parts['page'] );
	return $parts;
} );

add_action( 'wp_head', function () {
	$site = get_bloginfo( 'name' );
	$desc = get_bloginfo( 'description' );
	$url  = home_url( '/' );
	$type = 'website';
	if ( is_singular() ) {
		$post = get_queried_object();
		if ( has_excerpt( $post ) ) {
			$desc = get_the_excerpt( $post );
		}
		$url  = get_permalink( $post );
		$type = is_front_page() ? 'website' : 'article';
	}
	$title = wp_get_document_title();
	$img   = get_theme_file_uri( 'assets/img/ogp.jpg' );
	if ( is_singular() && has_post_thumbnail() ) {
		$img = get_the_post_thumbnail_url( null, 'full' );
	}
	printf( '<meta name="description" content="%s">' . "\n", esc_attr( $desc ) );
	printf( '<meta property="og:type" content="%s">' . "\n", esc_attr( $type ) );
	printf( '<meta property="og:site_name" content="%s">' . "\n", esc_attr( $site ) );
	printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $title ) );
	printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( $desc ) );
	printf( '<meta property="og:url" content="%s">' . "\n", esc_url( $url ) );
	printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $img ) );
	echo '<meta property="og:locale" content="ja_JP">' . "\n";
}, 2 );

/* Favicon fallback when no Site Icon is set in Settings → General. */
add_action( 'wp_head', function () {
	if ( has_site_icon() ) {
		return;
	}
	printf( '<link rel="icon" href="%s" type="image/png">' . "\n", esc_url( get_theme_file_uri( 'assets/img/logo.png' ) ) );
	printf( '<link rel="apple-touch-icon" href="%s">' . "\n", esc_url( get_theme_file_uri( 'assets/img/logo.png' ) ) );
}, 3 );

/* ---------- lhl/decor: fixed decorative markup (SVG animations etc.) ---------- */
add_action( 'init', function () {
	wp_register_script(
		'lhl-decor-editor',
		get_theme_file_uri( 'assets/js/decor-editor.js' ),
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components' ),
		LHL_VER,
		true
	);
	register_block_type( 'lhl/decor', array(
		'api_version'     => 3,
		'title'           => '装飾（テーマ固定）',
		'category'        => 'design',
		'attributes'      => array( 'name' => array( 'type' => 'string', 'default' => '' ) ),
		'supports'        => array( 'html' => false, 'inserter' => false, 'reusable' => false, 'customClassName' => false, 'className' => false ),
		'editor_script'   => 'lhl-decor-editor',
		'render_callback' => 'lhl_render_decor',
	) );
} );

/* ---------- lhl/map: Google Map embed; editors change only the address ---------- */
add_action( 'init', function () {
	register_block_type( 'lhl/map', array(
		'api_version'     => 3,
		'title'           => '地図（Google マップ）',
		'category'        => 'embed',
		'attributes'      => array(
			'query' => array( 'type' => 'string', 'default' => '' ),
			'zoom'  => array( 'type' => 'number', 'default' => 16 ),
		),
		'supports'        => array( 'html' => false, 'reusable' => false, 'className' => false, 'customClassName' => false ),
		'editor_script'   => 'lhl-decor-editor',
		'render_callback' => function ( $attrs ) {
			$q = isset( $attrs['query'] ) ? trim( $attrs['query'] ) : '';
			if ( '' === $q ) {
				return '';
			}
			$src = add_query_arg(
				array( 'q' => rawurlencode( $q ), 'z' => (int) ( $attrs['zoom'] ?? 16 ), 'output' => 'embed' ),
				'https://maps.google.com/maps'
			);
			return sprintf(
				'<iframe title="%s" src="%s" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
				esc_attr( '地図：' . $q ),
				esc_url( $src )
			);
		},
	) );
} );

function lhl_render_decor( $attrs ) {
	$name = isset( $attrs['name'] ) ? sanitize_file_name( $attrs['name'] ) : '';
	$file = get_theme_file_path( 'decor/' . $name . '.html' );
	if ( ! $name || ! is_readable( $file ) ) {
		return '';
	}
	return trim( file_get_contents( $file ) );
}

/* ---------- Contact Form 7: keep the form markup exactly as written ---------- */
add_filter( 'wpcf7_autop_or_not', '__return_false' );
