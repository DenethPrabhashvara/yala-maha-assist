import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../../utils/format'

export const CHART_COLORS = {
  primary: '#2563eb',
  teal: '#0d9488',
  amber: '#d97706',
  red: '#dc2626',
  indigo: '#4f46e5',
  slate: '#a1a1aa',
  green: '#16a34a',
  violet: '#7c3aed',
}

const axisTick = { fill: 'var(--chart-text)', fontSize: 11.5, fontWeight: 500 }

export function ChartTooltip({ active, payload, label, formatter, suffix = '', labelPrefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label !== undefined && (
        <p className="chart-tooltip-label">
          {labelPrefix}
          {label}
        </p>
      )}
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey || entry.name}>
          <span
            className="chart-tooltip-dot"
            style={{ background: entry.color || entry.fill || entry.payload?.color }}
          />
          <span className="chart-tooltip-name">{entry.name}</span>
          <strong>
            {formatter ? formatter(entry.value, entry) : formatNumber(entry.value)}
            {suffix}
          </strong>
        </div>
      ))}
    </div>
  )
}

export function StorageTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          dy={10}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          tickFormatter={(value) => `${value}%`}
          width={52}
        />
        <Tooltip
          content={<ChartTooltip suffix="%" formatter={(value) => Number(value).toFixed(1)} />}
          cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
        />
        <Area isAnimationActive={false}
          type="monotone"
          dataKey="storage"
          name="Average storage"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.6}
          fill={CHART_COLORS.primary}
          fillOpacity={0.12}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DistrictFarmersChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 0, bottom: 2 }}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis type="number" domain={[0, 'dataMax']} hide />
        <YAxis
          type="category"
          dataKey="district"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={94}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-2)' }}
          content={
            <ChartTooltip />
          }
        />
        <Bar isAnimationActive={false}
          dataKey="farmers"
          name="Registered farmers"
          radius={[0, 5, 5, 0]}
          barSize={11}
        >
          {data.map((entry) => (
            <Cell key={entry.district} fill={CHART_COLORS.teal} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Highest rainfall reported each day (bars) and how many reservoirs spilled (line)
export function RainfallSpillChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: -6, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} dy={10} interval={2} />
        <YAxis
          yAxisId="rain"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={46}
          tickFormatter={(value) => `${value}`}
        />
        <YAxis yAxisId="spill" orientation="right" hide allowDecimals={false} domain={[0, (max) => Math.max(4, max * 1.4)]} />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: 'var(--surface-2)' }}
        />
        <Bar isAnimationActive={false}
          yAxisId="rain"
          dataKey="rainfall"
          name="Highest rainfall (mm)"
          fill={CHART_COLORS.indigo}
          radius={[4, 4, 0, 0]}
          barSize={12}
         
        />
        <Line isAnimationActive={false}
          yAxisId="spill"
          type="monotone"
          dataKey="spilling"
          name="Reservoirs spilling"
          stroke={CHART_COLORS.amber}
          strokeWidth={2.2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function StatusDonut({ data, total, centerLabel = 'Reservoirs', size = 208 }) {
  return (
    <div className="donut-wrap" style={{ maxWidth: size }}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie isAnimationActive={false}
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="96%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={CHART_COLORS[entry.color] || entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={(value) => formatNumber(value)} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{formatNumber(total)}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  )
}

// warning is the gauge's alert level
export function RiverHydrograph({ data, warning, major }) {
  const maxValue = Math.max(major + 0.8, ...data.map((point) => point.level))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 18, right: 14, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          dy={10}
          interval={3}
        />
        <YAxis
          domain={[0, Number(maxValue.toFixed(1))]}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={48}
          tickFormatter={(value) => `${Number(value).toFixed(1)}m`}
        />
        <Tooltip
          content={<ChartTooltip suffix=" m" formatter={(value) => Number(value).toFixed(2)} />}
          cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
        />
        <ReferenceLine
          y={warning}
          stroke={CHART_COLORS.amber}
          strokeDasharray="6 4"
          strokeWidth={1.4}
          label={{
            value: `Alert ${warning.toFixed(1)}m`,
            position: 'insideTopRight',
            fill: CHART_COLORS.amber,
            fontSize: 10.5,
            fontWeight: 600,
          }}
        />
        <ReferenceLine
          y={major}
          stroke={CHART_COLORS.red}
          strokeDasharray="6 4"
          strokeWidth={1.4}
          label={{
            value: `Major flood ${major.toFixed(1)}m`,
            position: 'insideBottomRight',
            fill: CHART_COLORS.red,
            fontSize: 10.5,
            fontWeight: 600,
          }}
        />
        <Area isAnimationActive={false}
          type="monotone"
          dataKey="level"
          name="Water level"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.6}
          fill={CHART_COLORS.primary}
          fillOpacity={0.12}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function SmsVolumeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 4, left: -16, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} dy={10} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={46}
          tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
        />
        <Tooltip
          content={<ChartTooltip formatter={(value) => formatNumber(value)} />}
          cursor={{ fill: 'var(--surface-2)' }}
        />
        <Bar isAnimationActive={false} dataKey="delivered" name="Delivered" stackId="a" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} barSize={16} />
        <Bar isAnimationActive={false} dataKey="failed" name="Failed" stackId="a" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FarmerGrowthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 6, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} dy={10} />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={50} />
        <Tooltip content={<ChartTooltip formatter={(value) => formatNumber(value)} />} />
        <Area isAnimationActive={false}
          type="monotone"
          dataKey="farmers"
          name="New registrations"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.3}
          fill={CHART_COLORS.primary}
          fillOpacity={0.12}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area isAnimationActive={false}
          type="monotone"
          dataKey="active"
          name="Activated"
          stroke={CHART_COLORS.indigo}
          strokeWidth={1.6}
          strokeDasharray="4 4"
          fill="none"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CropDonut({ data, total, centerLabel = 'Farmers' }) {
  return (
    <div className="donut-wrap donut-sm">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie isAnimationActive={false}
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="94%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip suffix="%" />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{total}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  )
}

export function FlowSparkChart({ data, color = CHART_COLORS.primary }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
        <Line isAnimationActive={false}
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
