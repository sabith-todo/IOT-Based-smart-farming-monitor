import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  'Queued for Analysis': {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    icon: '⏳',
  },
  'Under Expert Review': {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: '🔬',
  },
  'Verified Clean': {
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: '✅',
  },
  'Action Required': {
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
    icon: '🚨',
  },
};

const PlantAnalysisHistory = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verificationModal, setVerificationModal] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    status: 'Verified Clean',
    expertNotes: '',
    verifiedBy: '',
  });
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/plant-analysis');
      const data = await response.json();

      let serverRecords = [];
      if (response.ok && data.success && Array.isArray(data.records)) {
        serverRecords = data.records;
      }

      // Merge with any offline / locally cached analyses
      const localRecords = JSON.parse(localStorage.getItem('tea_plant_analyses_local') || '[]');
      const combined = [...serverRecords];
      localRecords.forEach((loc) => {
        if (!combined.some((r) => r._id === loc._id)) {
          combined.push(loc);
        }
      });

      setRecords(combined);
    } catch (err) {
      console.warn('Failed to fetch from backend, loading local records:', err.message);
      const localRecords = JSON.parse(localStorage.getItem('tea_plant_analyses_local') || '[]');
      setRecords(localRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plant analysis record?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/plant-analysis/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.warn('Backend delete response not ok, checking local...');
      }
    } catch (err) {
      console.warn('Backend delete failed:', err.message);
    }

    // Always remove from local state and local storage
    setRecords((prev) => prev.filter((r) => r._id !== id));
    const local = JSON.parse(localStorage.getItem('tea_plant_analyses_local') || '[]');
    localStorage.setItem(
      'tea_plant_analyses_local',
      JSON.stringify(local.filter((r) => r._id !== id))
    );
    if (selectedRecord?._id === id) setSelectedRecord(null);
  };

  const handleOpenVerification = (record) => {
    setVerificationModal(record);
    setVerificationForm({
      status: record.status || 'Verified Clean',
      expertNotes: record.expertNotes || '',
      verifiedBy: record.verifiedBy || localStorage.getItem('userEmail') || 'Field Agronomist',
    });
  };

  const handleSaveVerification = async (e) => {
    e.preventDefault();
    if (!verificationModal) return;

    setSavingStatus(true);
    const id = verificationModal._id;

    try {
      const response = await fetch(`http://localhost:4000/api/plant-analysis/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationForm),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRecords((prev) =>
          prev.map((r) => (r._id === id ? { ...r, ...verificationForm, updatedAt: new Date().toISOString() } : r))
        );
      } else {
        // Update locally
        setRecords((prev) =>
          prev.map((r) => (r._id === id ? { ...r, ...verificationForm, updatedAt: new Date().toISOString() } : r))
        );
      }
    } catch (err) {
      // Offline fallback update
      setRecords((prev) =>
        prev.map((r) => (r._id === id ? { ...r, ...verificationForm, updatedAt: new Date().toISOString() } : r))
      );
    } finally {
      setSavingStatus(false);
      setVerificationModal(null);
    }
  };

  // Filtered List
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.plantationBlock && r.plantationBlock.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.symptomsObserved && r.symptomsObserved.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesBlock = blockFilter === 'ALL' || (r.plantationBlock && r.plantationBlock.includes(blockFilter));

    return matchesSearch && matchesStatus && matchesBlock;
  });

  // KPI Counts
  const totalCount = records.length;
  const queuedCount = records.filter((r) => r.status === 'Queued for Analysis').length;
  const underReviewCount = records.filter((r) => r.status === 'Under Expert Review').length;
  const verifiedCount = records.filter((r) => r.status === 'Verified Clean').length;
  const actionRequiredCount = records.filter((r) => r.status === 'Action Required').length;

  return (
    <div className="analysis-history-page" style={{ padding: '4px' }}>
      {/* Header & Breadcrumb */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.25))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '22px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <h2 style={{ margin: 0, color: '#f0fdf4', fontSize: '22px', fontWeight: 700 }}>
              Plantation Analysis & Agronomist History
            </h2>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {records.length} TOTAL SPECIMENS
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', maxWidth: '680px', lineHeight: 1.5 }}>
            Audit log of all registered leaf scans, field symptoms, AI inference queue statuses, and verified expert
            evaluations across tea plantation sectors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchRecords}
            style={{
              background: '#13281e',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#e2e8f0',
              padding: '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/dashboard/plant-analysis')}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              border: 'none',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
            }}
          >
            <span>➕</span> Upload New Specimen
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>TOTAL SCANS</div>
          <div style={{ color: '#f0fdf4', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            {totalCount}
          </div>
          <div style={{ color: '#6ee7b7', fontSize: '11px', marginTop: '2px' }}>Database registered</div>
        </div>

        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: '#fde68a', fontSize: '12px', fontWeight: 600 }}>QUEUED FOR MODEL</div>
          <div style={{ color: '#fbbf24', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            {queuedCount}
          </div>
          <div style={{ color: '#d97706', fontSize: '11px', marginTop: '2px' }}>Pending AI pipeline</div>
        </div>

        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: '#bae6fd', fontSize: '12px', fontWeight: 600 }}>EXPERT REVIEW</div>
          <div style={{ color: '#38bdf8', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            {underReviewCount}
          </div>
          <div style={{ color: '#0284c7', fontSize: '11px', marginTop: '2px' }}>Active agronomist check</div>
        </div>

        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 600 }}>VERIFIED HEALTHY</div>
          <div style={{ color: '#34d399', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            {verifiedCount}
          </div>
          <div style={{ color: '#059669', fontSize: '11px', marginTop: '2px' }}>Passed pathogen check</div>
        </div>

        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(248, 113, 113, 0.25)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ color: '#fca5a5', fontSize: '12px', fontWeight: 600 }}>ACTION REQUIRED</div>
          <div style={{ color: '#f87171', fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
            {actionRequiredCount}
          </div>
          <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '2px' }}>Treatment / Quarantine</div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div
        style={{
          background: '#0c1a14',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '300px' }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Search title, block, symptoms, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: '#08120e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              flex: 1,
              minWidth: '220px',
            }}
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: '#08120e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Queued for Analysis">Queued for Analysis</option>
            <option value="Under Expert Review">Under Expert Review</option>
            <option value="Verified Clean">Verified Clean</option>
            <option value="Action Required">Action Required</option>
          </select>

          {/* Block Filter */}
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            style={{
              background: '#08120e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <option value="ALL">All Plantation Sectors</option>
            <option value="Block A">Block A (Upper Valley)</option>
            <option value="Block B">Block B (Eastern Hillside)</option>
            <option value="Block C">Block C (Valley Terrace)</option>
            <option value="Block D">Block D (Nursery Zone)</option>
          </select>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? '#10b981' : '#08120e',
              color: viewMode === 'grid' ? '#fff' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ▦ Grid View
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              background: viewMode === 'table' ? '#10b981' : '#08120e',
              color: viewMode === 'table' ? '#fff' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ☰ Table View
          </button>
        </div>
      </div>

      {/* Main Records Display */}
      {loading ? (
        <div
          style={{
            background: '#0c1a14',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: '#94a3b8',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <div style={{ fontSize: '16px', color: '#f0fdf4' }}>Loading Plantation Specimen Records...</div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div
          style={{
            background: '#0c1a14',
            border: '1px dashed rgba(52, 211, 153, 0.25)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🍃</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#f0fdf4', fontSize: '18px' }}>
            No Analysis Records Found
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '14px', maxWidth: '420px', marginInline: 'auto' }}>
            {searchTerm || statusFilter !== 'ALL' || blockFilter !== 'ALL'
              ? 'No records match the selected filters. Try resetting search filters.'
              : 'Start by uploading foliage specimens from the plantation blocks for health analysis.'}
          </p>
          <button
            onClick={() => navigate('/dashboard/plant-analysis')}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            📸 Upload First Tea Specimen
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredRecords.map((record) => {
            const statusStyle = STATUS_CONFIG[record.status] || STATUS_CONFIG['Queued for Analysis'];
            return (
              <div
                key={record._id}
                style={{
                  background: '#0c1a14',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s, border-color 0.15s',
                }}
              >
                {/* Thumbnail Header with Status Badge */}
                <div
                  style={{
                    position: 'relative',
                    height: '190px',
                    background: '#040806',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedRecord(record)}
                >
                  <img
                    src={record.imageUrl}
                    alt={record.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: statusStyle.bg,
                      border: `1px solid ${statusStyle.border}`,
                      color: statusStyle.color,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{statusStyle.icon}</span> {record.status}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#a7f3d0',
                      fontFamily: 'monospace',
                    }}
                  >
                    📍 {record.gps?.lat || '11.0168'}° N, {record.gps?.lng || '76.9558'}° E
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        color: '#f0fdf4',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedRecord(record)}
                    >
                      {record.title}
                    </h4>
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>
                      {record.plantationBlock}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    <span style={{ color: '#cbd5e1' }}>Stage:</span> {record.specimenStage || 'Flush'}
                    <br />
                    <span style={{ color: '#cbd5e1' }}>Cultivar:</span> {record.cultivar || 'Camellia sinensis'}
                  </div>

                  {record.symptomsObserved && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#fca5a5',
                      }}
                    >
                      <strong>Symptoms:</strong> {record.symptomsObserved}
                    </div>
                  )}

                  {/* AI Pipeline State Pill */}
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>⚡</span> Model State: <em>Pending ML Container Hookup</em>
                  </div>

                  {record.expertNotes && (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#bae6fd',
                      }}
                    >
                      <strong>Agronomist:</strong> {record.expertNotes}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {new Date(record.time || record.createdAt).toLocaleDateString()}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenVerification(record)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        👨‍🌾 Verify
                      </button>
                      <button
                        onClick={() => setSelectedRecord(record)}
                        style={{
                          background: 'rgba(52, 211, 153, 0.15)',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          color: '#34d399',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDelete(record._id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div
          style={{
            background: '#0c1a14',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '14px',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#08120e', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#6ee7b7' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Specimen</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Block & Cultivar</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Symptoms / Notes</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Verification Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>GPS & Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const statusStyle = STATUS_CONFIG[record.status] || STATUS_CONFIG['Queued for Analysis'];
                return (
                  <tr
                    key={record._id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={record.imageUrl}
                          alt={record.title}
                          style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#f0fdf4' }}>{record.title}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{record.specimenStage}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ color: '#4ade80', fontWeight: 600 }}>{record.plantationBlock}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>{record.cultivar}</div>
                    </td>

                    <td style={{ padding: '10px 14px', maxWidth: '240px' }}>
                      <div style={{ color: '#fca5a5', fontSize: '12px' }}>
                        {record.symptomsObserved || 'None reported'}
                      </div>
                      {record.expertNotes && (
                        <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '2px' }}>
                          Expert: {record.expertNotes}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          background: statusStyle.bg,
                          border: `1px solid ${statusStyle.border}`,
                          color: statusStyle.color,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {statusStyle.icon} {record.status}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>
                      <div style={{ fontFamily: 'monospace' }}>
                        {record.gps?.lat || '11.0168'}, {record.gps?.lng || '76.9558'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(record.time || record.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenVerification(record)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => setSelectedRecord(record)}
                          style={{
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            color: '#34d399',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              background: '#0c1a14',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f0fdf4', fontSize: '18px' }}>{selectedRecord.title}</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '360px', marginBottom: '16px', background: '#000' }}>
              <img
                src={selectedRecord.imageUrl}
                alt={selectedRecord.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Plantation Block:</span>
                <div style={{ color: '#4ade80', fontWeight: 600 }}>{selectedRecord.plantationBlock}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Cultivar & Stage:</span>
                <div style={{ color: '#f1f5f9' }}>{selectedRecord.cultivar} • {selectedRecord.specimenStage}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>GPS Location:</span>
                <div style={{ color: '#6ee7b7', fontFamily: 'monospace' }}>
                  {selectedRecord.gps?.lat || '11.0168'}° N, {selectedRecord.gps?.lng || '76.9558'}° E
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Status:</span>
                <div style={{ color: '#fbbf24', fontWeight: 600 }}>{selectedRecord.status}</div>
              </div>
            </div>

            {selectedRecord.symptomsObserved && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Symptoms:</span>
                <div style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  {selectedRecord.symptomsObserved}
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Agronomist Notes:</span>
                <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '2px' }}>
                  {selectedRecord.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  handleOpenVerification(selectedRecord);
                  setSelectedRecord(null);
                }}
                style={{
                  background: '#059669',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Update Verification Status
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: '#1e293b',
                  border: 'none',
                  color: '#e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGRONOMIST VERIFICATION MODAL */}
      {verificationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setVerificationModal(null)}
        >
          <div
            style={{
              background: '#0c1a14',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f0fdf4', fontSize: '18px' }}>
                👨‍🌾 Update Agronomist Evaluation
              </h3>
              <button
                onClick={() => setVerificationModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVerification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Verification Status
                </label>
                <select
                  value={verificationForm.status}
                  onChange={(e) => setVerificationForm((prev) => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#08120e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value="Queued for Analysis">Queued for Analysis</option>
                  <option value="Under Expert Review">Under Expert Review</option>
                  <option value="Verified Clean">Verified Clean</option>
                  <option value="Action Required">Action Required (Quarantine / Treatment)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Agronomist Expert Notes & Recommendation
                </label>
                <textarea
                  rows="4"
                  placeholder="Record treatment plan, fungicide dosage, shade adjustment, or confirmation details..."
                  value={verificationForm.expertNotes}
                  onChange={(e) => setVerificationForm((prev) => ({ ...prev, expertNotes: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#08120e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Verified By (Agronomist / Officer)
                </label>
                <input
                  type="text"
                  value={verificationForm.verifiedBy}
                  onChange={(e) => setVerificationForm((prev) => ({ ...prev, verifiedBy: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#08120e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setVerificationModal(null)}
                  style={{
                    background: '#1e293b',
                    border: 'none',
                    color: '#e2e8f0',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    color: '#fff',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    cursor: savingStatus ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {savingStatus ? 'Saving...' : 'Confirm Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantAnalysisHistory;
