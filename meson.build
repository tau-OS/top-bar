project(
    'tau-top-bar',
    version: '1',
    meson_version: '>= 0.59.0',
    default_options: [ 'warning_level=2', ]
)

app_id = 'top-bar@tauos.co'

gnome = import('gnome')
i18n = import('i18n')

install_dir = join_paths(get_option('datadir'), 'gnome-shell', 'extensions', app_id)

sources = [
    'metadata.json',
    'extension.js',
    'stylesheet.css',
]

if get_option('prefix') == '/usr'
	gnome.post_install(
        glib_compile_schemas: true,
    )
endif

install_data(
    sources: sources,
    install_dir: install_dir
)
