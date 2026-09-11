module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    let loja = (req.query.loja || req.query.slug || '').trim();

    // Fallback 1: Buscar do cookie 'active_tenant_id'
    if (!loja && req.headers && req.headers.cookie) {
        try {
            const match = req.headers.cookie.match(/(?:^|;\s*)active_tenant_id=([^;]+)/);
            if (match && match[1]) {
                loja = decodeURIComponent(match[1].trim());
            }
        } catch (e) {}
    }

    // Fallback 2: Buscar do cabeçalho Referer
    if (!loja && req.headers && req.headers.referer) {
        try {
            const refUrl = new URL(req.headers.referer);
            const refLoja = refUrl.searchParams.get('loja') || refUrl.searchParams.get('slug');
            if (refLoja) {
                loja = refLoja.trim();
            } else {
                const parts = refUrl.pathname.split('/').filter(p => p && p !== 'index.html');
                const ignore = ['master', 'AgendamentoFacil', 'assets', 'sw.js', 'robots.txt', 'api'];
                const found = parts.find(p => !ignore.includes(p));
                if (found) loja = found.trim();
            }
        } catch (e) {}
    }

    if (loja === 'totem') {
        loja = 'centauro';
    }

    let name = (req.query.name || '').trim();
    if (!name) {
        if (loja && loja !== 'centauro') {
            name = loja.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            name = 'Centauro Barbearia';
        }
    }

    const shortName = name.length > 20 ? name.substring(0, 20) : name;
    const isTenant = !!loja;
    
    // start_url com path E query parameter para blindar qualquer roteador
    const startUrl = isTenant
        ? `/${encodeURIComponent(loja)}?loja=${encodeURIComponent(loja)}&pwa=1`
        : `/?pwa=1`;
    
    const appId = isTenant ? `/${encodeURIComponent(loja)}` : `/`;

    const customIcon = req.query.icon ? req.query.icon.trim() : null;
    const icons = customIcon ? [
        {
            src: customIcon,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
        },
        {
            src: customIcon,
            sizes: "512x512",
            type: "image/png"
        }
    ] : [
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
    ];

    const manifest = {
        name: name,
        short_name: shortName,
        description: `Sistema de Gestão - ${name}`,
        id: appId,
        start_url: startUrl,
        scope: "/",
        display: "standalone",
        background_color: "#0B0E14",
        theme_color: "#0B0E14",
        orientation: "portrait-primary",
        icons: icons
    };

    return res.status(200).json(manifest);
};
