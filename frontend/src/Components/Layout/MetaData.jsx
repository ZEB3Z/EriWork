// React 19 moves <title> into the page <head> automatically.
export default function MetaData({ title }) {
    return <title>{`${title} — EriWork`}</title>
}
