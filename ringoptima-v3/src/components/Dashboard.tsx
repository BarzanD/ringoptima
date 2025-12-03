import { useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Phone } from 'lucide-react';
import type { Contact } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  contacts: Contact[];
}

const COLORS = {
  telia: '#FF6B35',
  tele2: '#4ECDC4',
  tre: '#A855F7',
  telenor: '#3B82F6',
  other: '#94A3B8',
};

const STATUS_COLORS = {
  new: '#3B82F6',
  contacted: '#F59E0B',
  interested: '#10B981',
  not_interested: '#EF4444',
  converted: '#059669',
};

export function Dashboard({ contacts }: DashboardProps) {
  // Calculate timeline data (conversions over time)
  const timelineData = useMemo(() => {
    const grouped = new Map<string, { date: string; nya: number; kontaktade: number; intresserade: number; konverterade: number }>();

    contacts.forEach((contact) => {
      const date = new Date(contact.createdAt).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });

      if (!grouped.has(date)) {
        grouped.set(date, { date, nya: 0, kontaktade: 0, intresserade: 0, konverterade: 0 });
      }

      const entry = grouped.get(date)!;
      if (contact.status === 'new') entry.nya++;
      else if (contact.status === 'contacted') entry.kontaktade++;
      else if (contact.status === 'interested') entry.intresserade++;
      else if (contact.status === 'converted') entry.konverterade++;
    });

    return Array.from(grouped.values()).slice(-7); // Last 7 days
  }, [contacts]);

  // Calculate operator distribution
  const operatorData = useMemo(() => {
    const counts = new Map<string, number>();

    contacts.forEach((contact) => {
      const ops = contact.operators.toLowerCase();
      if (ops.includes('telia')) {
        counts.set('Telia', (counts.get('Telia') || 0) + 1);
      } else if (ops.includes('tele2')) {
        counts.set('Tele2', (counts.get('Tele2') || 0) + 1);
      } else if (ops.includes('hi3g') || ops.includes('tre')) {
        counts.set('Tre', (counts.get('Tre') || 0) + 1);
      } else if (ops.includes('telenor')) {
        counts.set('Telenor', (counts.get('Telenor') || 0) + 1);
      } else if (ops.trim()) {
        counts.set('Annat', (counts.get('Annat') || 0) + 1);
      }
    });

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  // Calculate status breakdown
  const statusData = useMemo(() => {
    return [
      { name: 'Nya', value: contacts.filter(c => c.status === 'new').length },
      { name: 'Kontaktade', value: contacts.filter(c => c.status === 'contacted').length },
      { name: 'Intresserade', value: contacts.filter(c => c.status === 'interested').length },
      { name: 'Ej intresserade', value: contacts.filter(c => c.status === 'not_interested').length },
      { name: 'Konverterade', value: contacts.filter(c => c.status === 'converted').length },
    ].filter(item => item.value > 0);
  }, [contacts]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const total = contacts.length;
    const converted = contacts.filter(c => c.status === 'converted').length;
    const interested = contacts.filter(c => c.status === 'interested').length;
    const contacted = contacts.filter(c => c.status === 'contacted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
    const engagementRate = total > 0 ? (((contacted + interested + converted) / total) * 100).toFixed(1) : '0';

    return {
      total,
      converted,
      interested,
      contacted,
      conversionRate,
      engagementRate,
    };
  }, [contacts]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Konverteringsgrad"
          value={`${metrics.conversionRate}%`}
          color="text-emerald-400"
          bgColor="bg-emerald-500/20"
        />
        <MetricCard
          icon={TrendingUp}
          label="Engagemangsgrad"
          value={`${metrics.engagementRate}%`}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
        />
        <MetricCard
          icon={Target}
          label="Konverterade"
          value={metrics.converted.toString()}
          color="text-green-400"
          bgColor="bg-green-500/20"
        />
        <MetricCard
          icon={Phone}
          label="Kontaktade"
          value={metrics.contacted.toString()}
          color="text-yellow-400"
          bgColor="bg-yellow-500/20"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Aktivitet över tid</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="nya" stroke="#3B82F6" strokeWidth={2} name="Nya" />
              <Line type="monotone" dataKey="kontaktade" stroke="#F59E0B" strokeWidth={2} name="Kontaktade" />
              <Line type="monotone" dataKey="intresserade" stroke="#10B981" strokeWidth={2} name="Intresserade" />
              <Line type="monotone" dataKey="konverterade" stroke="#059669" strokeWidth={2} name="Konverterade" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Operator Distribution */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Operatörsfördelning</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={operatorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {operatorData.map((entry, index) => {
                  const colorKey = entry.name.toLowerCase() as keyof typeof COLORS;
                  return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || COLORS.other} />;
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="text-xl font-bold mb-6">Statusfördelning</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => {
                  const colors = [
                    STATUS_COLORS.new,
                    STATUS_COLORS.contacted,
                    STATUS_COLORS.interested,
                    STATUS_COLORS.not_interested,
                    STATUS_COLORS.converted,
                  ];
                  return <Cell key={`cell-${index}`} fill={colors[index] || '#94A3B8'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={cn('glass rounded-2xl p-5', bgColor)}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={cn('w-5 h-5', color)} />
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn('text-3xl font-bold', color)}>{value}</div>
    </div>
  );
}
