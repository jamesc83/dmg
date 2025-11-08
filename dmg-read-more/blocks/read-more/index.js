(function (wp) {
    /**
     * Registers a new block provided a unique name and an object defining its behavior.
     * @see https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/#registering-a-block
     */
    var registerBlockType = wp.blocks.registerBlockType;
    /**
     * Returns a new element of given type. Element is an abstraction layer atop React.
     * @see https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-element/
     */
    var el = wp.element.createElement;
    /**
     * Retrieves the translation of text.
     * @see https://wordpress.org/gutenberg/handbook/designers-developers/developers/packages/packages-i18n/
     */
    var __ = wp.i18n.__;

    // Editor components and utilities we need
    var InspectorControls = (wp.blockEditor || wp.editor).InspectorControls;
    var PanelBody = wp.components.PanelBody;
    var TextControl = wp.components.TextControl;
    var Button = wp.components.Button;
    var SelectControl = wp.components.SelectControl;
    var Spinner = wp.components.Spinner;
    var apiFetch = wp.apiFetch;
    var useState = wp.element.useState;
    var useEffect = wp.element.useEffect;

    /**
     * Every block starts by registering a new block type definition.
     * @see https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/#registering-a-block
     */
    registerBlockType('dmg-read-more/read-more', {
        title: __('DMG Read More', 'dmg-read-more'),
        icon: 'admin-links',
        category: 'widgets',

       
        // store the selected post id
        attributes: {
            selectedPostId: {
                type: 'number'
            }
            ,
            selectedPostTitle: {
                type: 'string'
            },
            selectedPostLink: {
                type: 'string'
            }
        },

        /**
         * The edit function describes the structure of your block in the context of the editor.
         * This represents what the editor will render when the block is used.
         * @see https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/#edit
         *
         * @param {Object} [props] Properties passed from the editor.
         * @return {Element}       Element to render.
         */
        edit: function (props) {
            var attributes = props.attributes || {};
            var setAttributes = props.setAttributes;
            var className = props.className;
            const [searchTerm, setSearchTerm] = useState('');
            const [results, setResults] = useState([]);
            const [loading, setLoading] = useState(false);
            const [page, setPage] = useState(1);
            const [perPage, setPerPage] = useState(20);
            const [totalPages, setTotalPages] = useState(0);
            const [totalPosts, setTotalPosts] = useState(0);
            const [selectedPost, setSelectedPost] = useState(null);
            const [postLoading, setPostLoading] = useState(false);

            function doSearch(requestedPage) {
                var p = requestedPage || page || 1;
                if (!searchTerm) {
                    setResults([]);
                    setTotalPages(0);
                    setTotalPosts(0);
                    return;
                }
                setLoading(true);
                var path = '/wp/v2/posts?per_page=' + perPage + '&page=' + p + '&search=' + encodeURIComponent(searchTerm) + '&orderby=date&order=desc';
                // Request the raw response to read pagination headers
                apiFetch({ path: path, parse: false })
                    .then(function (response) {
                        // response is a Fetch Response. Read headers then JSON body
                        var total = parseInt(response.headers.get('X-WP-Total') || 0, 10);
                        var totalP = parseInt(response.headers.get('X-WP-TotalPages') || 0, 10);
                        response.json().then(function (posts) {
                            setResults(posts || []);
                            setTotalPosts(total);
                            setTotalPages(totalP);
                            setPage(p);
                            setLoading(false);
                        }).catch(function () {
                            setResults([]);
                            setTotalPosts(0);
                            setTotalPages(0);
                            setLoading(false);
                        });
                    })
                    .catch(function () {
                        setResults([]);
                        setTotalPosts(0);
                        setTotalPages(0);
                        setLoading(false);
                    });
            }

            function goToPage(newPage) {
                if (newPage < 1) return;
                if (totalPages && newPage > totalPages) return;
                doSearch(newPage);
            }

            // Fetch the selected post for editor preview (title + link)
            function fetchSelectedPost(id) {
                if (!id) {
                    setSelectedPost(null);
                    return;
                }
                setPostLoading(true);
                apiFetch({ path: '/wp/v2/posts/' + id })
                    .then(function (post) {
                        setSelectedPost(post);
                        var title = (post.title && post.title.rendered) ? post.title.rendered.replace(/<[^>]+>/g, '') : '';
                        setAttributes({ selectedPostId: id, selectedPostTitle: title, selectedPostLink: post.link });
                        setPostLoading(false);
                    })
                    .catch(function () {
                        setSelectedPost(null);
                        setPostLoading(false);
                    });
            }

            // When selectedPostId changes, fetch post for editor preview
            useEffect(function () {
                if (attributes.selectedPostId) {
                    fetchSelectedPost(attributes.selectedPostId);
                } else {
                    setSelectedPost(null);
                }
            }, [attributes.selectedPostId]);

            function makeOptions(posts) {
                return (posts || []).map(function (p) {
                    var title = (p.title && p.title.rendered) ? p.title.rendered.replace(/<[^>]+>/g, '') : '#' + p.id;
                    return { label: title, value: p.id };
                });
            }

            return el(
                'div',
                { className: className },

                el(
                    InspectorControls,
                    {},
                    el(PanelBody, { title: __('Select a post', 'dmg-read-more'), initialOpen: true },
                        el(TextControl, {
                            label: __('Search posts', 'dmg-read-more'),
                            value: searchTerm,
                            onChange: function (val) { setSearchTerm(val); }
                        }),
                        el(Button, { isPrimary: true, onClick: function () { doSearch(1); } }, __('Search', 'dmg-read-more')),
                        loading ? el(Spinner, {}) : null,
                        // Pagination controls
                        el('div', { style: { display: 'flex', alignItems: 'center', marginTop: '8px' } },
                            el(Button, { isSecondary: true, disabled: loading || page <= 1, onClick: function () { goToPage(page - 1); } }, __('Prev', 'dmg-read-more')),
                            el('div', { style: { padding: '0 8px' } },
                                totalPages ? (__('Page', 'dmg-read-more') + ' ' + page + ' / ' + totalPages) : (totalPosts ? (__('Page', 'dmg-read-more') + ' ' + page) : '')
                            ),
                            el(Button, { isSecondary: true, disabled: loading || (totalPages ? page >= totalPages : false), onClick: function () { goToPage(page + 1); } }, __('Next', 'dmg-read-more'))
                        ),
                        el(SelectControl, {
                            label: __('Choose post', 'dmg-read-more'),
                            value: attributes.selectedPostId || '',
                            options: makeOptions(results),
                            onChange: function (val) {
                                var id = parseInt(val, 10);
                                var post = (results || []).find(function (p) { return p.id === id; });
                                if (post) {
                                    var title = (post.title && post.title.rendered) ? post.title.rendered.replace(/<[^>]+>/g, '') : '';
                                    setAttributes({ selectedPostId: id, selectedPostTitle: title, selectedPostLink: post.link });
                                    setSelectedPost(post);
                                } else {
                                    setAttributes({ selectedPostId: id });
                                }
                            }
                        })
                    )
                ),

                // Editor preview: prefer using saved attributes (title/link), fallback to fetched post or loading
                (function () {
                    var preview = null;
                    var prefix = __('Read More', 'dmg-read-more');
                    if (attributes.selectedPostTitle && attributes.selectedPostLink) {
                        preview = el('p', { className: 'dmg-read-more', 'data-post-id': attributes.selectedPostId || '' },
                            prefix + ' ',
                            el('a', { href: attributes.selectedPostLink, target: '_blank', rel: 'noreferrer noopener' }, attributes.selectedPostTitle)
                        );
                    } else if (selectedPost) {
                        var _title = (selectedPost.title && selectedPost.title.rendered) ? selectedPost.title.rendered.replace(/<[^>]+>/g, '') : ('#' + selectedPost.id);
                        preview = el('p', { className: 'dmg-read-more', 'data-post-id': attributes.selectedPostId || '' },
                            prefix + ' ',
                            el('a', { href: selectedPost.link, target: '_blank', rel: 'noreferrer noopener' }, _title)
                        );
                    } else if (postLoading) {
                        preview = el(Spinner, {});
                    } else {
                        preview = el('p', {}, __('No post selected', 'dmg-read-more'));
                    }
                    return preview;
                })()
            );
        },

        /**
         * Save the block so a link is displayed on the frontend.
         * @return {Element}       Element to render.
         * @param {Object} [props] Properties passed from the editor.
         */
        save: function (props) {
            var attributes = props.attributes || {};
            var prefix = __('Read More', 'dmg-read-more');
            return el(
                'p',
                { className: 'dmg-read-more', 'data-post-id': attributes.selectedPostId || '' },
                attributes.selectedPostId
                    ? [
                        prefix + ' ',
                        el('a', { href: attributes.selectedPostLink || '#', target: '_blank', rel: 'noreferrer noopener' }, attributes.selectedPostTitle || ('#' + attributes.selectedPostId))
                    ]
                    : el('p', {}, __('No post selected', 'dmg-read-more'))
            );
        }
    });
})(
    window.wp
);
