import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import ShowChartRounded from '@mui/icons-material/ShowChartRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import api, { getErrorMessage } from '../../api'
import { formatMoney } from '../../Utils/helpers'

// "2026-10-15" in local time (what <input type="date"> uses)
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const longDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })

export default function SalesChart() {
    const today = toISO(new Date())
    const [range, setRange] = useState({ start: toISO(daysAgo(29)), end: today })
    const [preset, setPreset] = useState(30)
    const [chartType, setChartType] = useState('line')
    // Each result remembers which range it is for; while they differ, we're loading.
    const rangeKey = `${range.start}|${range.end}`
    const [result, setResult] = useState({ key: '', data: null, error: '' })

    const invalid = !range.start || !range.end || range.start > range.end

    useEffect(() => {
        if (invalid) return
        let cancelled = false // ignore the answer if the range changed meanwhile
        api.get('/admin/sales', { params: { startDate: range.start, endDate: range.end } })
            .then(({ data }) => !cancelled && setResult({ key: rangeKey, data, error: '' }))
            .catch((err) => !cancelled && setResult({ key: rangeKey, data: null, error: getErrorMessage(err) }))
        return () => { cancelled = true }
    }, [rangeKey, invalid, range.start, range.end])

    const loading = result.key !== rangeKey
    const data = loading ? null : result.data
    const error = loading ? '' : result.error

    const choosePreset = (days) => {
        if (!days) return
        setPreset(days)
        setRange({ start: toISO(daysAgo(days - 1)), end: today })
    }
    const changeDate = (key) => (e) => {
        setPreset(null)
        setRange({ ...range, [key]: e.target.value })
    }

    const tooltipProps = {
        formatter: (value, name) => [name === 'total' ? formatMoney(value) : value, name === 'total' ? 'Sales' : 'Orders'],
        labelFormatter: longDate,
        contentStyle: { borderRadius: 8, border: '1px solid #e3e8f0' }
    }
    const axes = [
        <CartesianGrid key="g" strokeDasharray="3 3" stroke="#e3e8f0" vertical={false} />,
        <XAxis key="x" dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#5b6b7f' }} minTickGap={24} />,
        <YAxis key="y" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12, fill: '#5b6b7f' }} width={60} />,
        <Tooltip key="t" {...tooltipProps} />
    ]

    return (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
                <Box>
                    <Typography variant="h3">Sales</Typography>
                    <Typography variant="body2" color="text.secondary">Paid orders per day (cancelled orders excluded)</Typography>
                </Box>
                <ToggleButtonGroup size="small" exclusive value={chartType} onChange={(e, v) => v && setChartType(v)} aria-label="Chart type">
                    <ToggleButton value="line" aria-label="Line chart"><ShowChartRounded fontSize="small" sx={{ mr: 0.5 }} />Line</ToggleButton>
                    <ToggleButton value="bar" aria-label="Bar chart"><BarChartRounded fontSize="small" sx={{ mr: 0.5 }} />Bar</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <TextField type="date" label="From" value={range.start} onChange={changeDate('start')}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }} />
                <TextField type="date" label="To" value={range.end} onChange={changeDate('end')}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }} />
                <ToggleButtonGroup size="small" exclusive value={preset} onChange={(e, v) => choosePreset(v)} aria-label="Quick range">
                    <ToggleButton value={7}>7 days</ToggleButton>
                    <ToggleButton value={30}>30 days</ToggleButton>
                    <ToggleButton value={90}>90 days</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {invalid && <Alert severity="warning">Choose a start date that is on or before the end date.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            {!invalid && !error && (
                <>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
                        {[
                            ['Sales in range', data ? formatMoney(data.totalSales) : '—'],
                            ['Orders', data ? data.totalOrders : '—'],
                            ['Average order', data && data.totalOrders ? formatMoney(data.totalSales / data.totalOrders) : '—']
                        ].map(([label, value]) => (
                            <Box key={label}>
                                <Typography variant="body2" color="text.secondary">{label}</Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: 'secondary.main' }}>{value}</Typography>
                            </Box>
                        ))}
                    </Box>
                    {!data ? (
                        <Skeleton variant="rounded" height={320} />
                    ) : (
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'line' ? (
                                    <LineChart data={data.sales} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        {axes}
                                        <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={data.sales} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        {axes}
                                        <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    )
}
