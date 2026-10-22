import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Users, Lock, RefreshCw, Eye, Check } from 'lucide-react';

export default function AdminSecurityDashboard({ token, onClose }) {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'users', 'reports'
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, [selectedSeverity]);

  const fetchSecurityData = async () => {
    try {
      const [statsRes, eventsRes, usersRes, reportsRes] = await Promise.all([
        fetch('/api/security/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/security/events?severity=${selectedSeverity}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/security/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/security/reports', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const [statsData, eventsData, usersData, reportsData] = await Promise.all([
        statsRes.json(),
        eventsRes.json(),
        usersRes.json(),
        reportsRes.json()
      ]);

      if (statsData.success) setStats(statsData);
      if (eventsData.success) setEvents(eventsData.events);
      if (usersData.success) setUsersList(usersData.users);
      if (reportsData.success) setReportsList(reportsData.reports);
    } catch (err) {
      console.error('Error fetching admin security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveEvent = async (eventId) => {
    try {
      const res = await fetch('/api/security/resolve-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId,
          resolutionNote: 'Reviewed by security administrator. Rate-limit verified.'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSecurityData();
      }
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '960px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(244, 63, 94, 0.4)'
            }}>
              <ShieldAlert size={22} color="#FDA4AF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Admin Security Operations Center (SOC)</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Real-time intrusion detection, brute-force defense & moderation audit logs
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchSecurityData} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
              Close
            </button>
          </div>
        </div>

        {/* Security Summary Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(7, 13, 24, 0.7)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Events</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>{stats.totalEvents}</div>
            </div>
            <div style={{ background: 'rgba(7, 13, 24, 0.7)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Failed Logins</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B' }}>{stats.failedLogins}</div>
            </div>
            <div style={{ background: 'rgba(7, 13, 24, 0.7)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Critical / High Alerts</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F43F5E' }}>
                {(stats.countsBySeverity.CRITICAL || 0) + (stats.countsBySeverity.HIGH || 0)}
              </div>
            </div>
            <div style={{ background: 'rgba(7, 13, 24, 0.7)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Community Reports</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A78BFA' }}>{stats.userReportsCount}</div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('events')}
            className={activeTab === 'events' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: '0.85rem' }}
          >
            Intrusion & Security Incidents
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: '0.85rem' }}
          >
            User Accounts ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={activeTab === 'reports' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ fontSize: '0.85rem' }}
          >
            Safety Reports ({reportsList.length})
          </button>
        </div>

        {/* TAB 1: SECURITY EVENTS */}
        {activeTab === 'events' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: selectedSeverity === sev ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: selectedSeverity === sev ? '#FFF' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No incidents found for this filter.
              </div>
            ) : (
              events.map((ev) => {
                const badgeClass =
                  ev.severity === 'CRITICAL' ? 'badge-rose' :
                  ev.severity === 'HIGH' ? 'badge-rose' :
                  ev.severity === 'WARNING' ? 'badge-violet' : 'badge-cyan';

                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(7, 13, 24, 0.7)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span className={`badge ${badgeClass}`}>{ev.severity}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ev.eventType}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '2px' }}>
                        {ev.details}
                      </div>
                      {ev.ip && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Source IP: <code>{ev.ip}</code>
                        </div>
                      )}
                    </div>

                    <div>
                      {ev.resolved ? (
                        <span style={{ fontSize: '0.8rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => resolveEvent(ev.id)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: USER ACCOUNTS */}
        {activeTab === 'users' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(7, 13, 24, 0.7)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</span>
                      <span className={u.role === 'admin' ? 'badge badge-rose' : 'badge badge-cyan'}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.email} • Level: {u.currentLevel} • Age: {u.age || 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-violet">{u.streak} Day Streak</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {u.lessonsCompletedCount} Lessons
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY REPORTS */}
        {activeTab === 'reports' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {reportsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Zero active user reports. Community is safe and respectful!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reportsList.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#FDA4AF', marginBottom: '4px' }}>
                      Reason: {rep.reason}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                      Comments: {rep.comments || 'No written comments.'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Reported by user <code>{rep.reporterId}</code> on {new Date(rep.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
