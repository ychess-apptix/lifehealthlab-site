/* Editor view of the lhl/decor block: a small locked label. The real markup is rendered by the theme. */
( function ( wp ) {
	var el = wp.element.createElement;
	wp.blocks.registerBlockType( 'lhl/decor', {
		apiVersion: 3,
		title: '装飾（テーマ固定）',
		description: 'テーマが描画する装飾（アニメーションSVGなど）です。編集はできません。',
		icon: 'art',
		category: 'design',
		attributes: { name: { type: 'string', default: '' } },
		supports: { html: false, inserter: false, reusable: false, customClassName: false, className: false },
		edit: function ( props ) {
			var bp = wp.blockEditor.useBlockProps( { className: 'lhl-decor-ph' } );
			return el( 'span', bp, '◇ ' + ( props.attributes.name || 'decor' ) );
		},
		save: function () { return null; }
	} );

	/* Google Map: only the address is editable. */
	wp.blocks.registerBlockType( 'lhl/map', {
		apiVersion: 3,
		title: '地図（Google マップ）',
		description: '住所を入力すると Google マップを表示します。',
		icon: 'location',
		category: 'embed',
		attributes: { query: { type: 'string', default: '' }, zoom: { type: 'number', default: 16 } },
		supports: { html: false, reusable: false, className: false, customClassName: false },
		edit: function ( props ) {
			var bp = wp.blockEditor.useBlockProps( { className: 'lhl-map-ph' } );
			return el( 'div', bp,
				el( wp.components.TextControl, {
					label: '地図に表示する住所',
					value: props.attributes.query,
					onChange: function ( v ) { props.setAttributes( { query: v } ); },
					__nextHasNoMarginBottom: true
				} )
			);
		},
		save: function () { return null; }
	} );
} )( window.wp );
