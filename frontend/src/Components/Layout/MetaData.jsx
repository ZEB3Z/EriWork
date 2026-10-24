import { Helmet } from 'react-helmet'

const DEFAULT_DESCRIPTION = 'EriWork sells WiFi routers, mesh systems, range extenders, switches, cables and other networking gear for home and office.'

// Per-page <title> and meta tags (react-helmet), for SEO and link previews.
// noIndex: keep private pages (admin, account, checkout) out of search engines.
export default function MetaData({ title, description = DEFAULT_DESCRIPTION, image, noIndex = false }) {
    const fullTitle = `${title} — EriWork`
    const desc = description.length > 160 ? `${description.slice(0, 157).trim()}…` : description
    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="EriWork" />
            {image && <meta property="og:image" content={image} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}
        </Helmet>
    )
}
