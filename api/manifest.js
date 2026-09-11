module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const loja = (req.query.loja || req.query.slug || '').trim();
    let name = (req.query.name || '').trim();
    
    if (!name) {
        if (loja && loja !== 'centauro') {
            name = loja.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            name = 'Centauro Barbearia';
        }
    }

    const shortName = name.length > 15 ? name.substring(0, 15) : name;
    const startUrl = loja ? `/?loja=${encodeURIComponent(loja)}&pwa=1` : './index.html?pwa=1';

    const manifest = {
        name: name,
        short_name: shortName,
        description: `Sistema de Gestão - ${name}`,
        start_url: startUrl,
        scope: "/",
        display: "standalone",
        background_color: "#0B0E14",
        theme_color: "#0B0E14",
        orientation: "portrait-primary",
        icons: [
            {
                src: "/favicon.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: "/logo.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    };

    return res.status(200).json(manifest);
};
