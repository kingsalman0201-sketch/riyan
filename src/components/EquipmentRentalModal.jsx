import React, { useState, useMemo } from 'react';
import './EquipmentRentalModal.css';

/* ── Mock equipment listings ── */
const ALL_EQUIPMENT = [
  {
    id: 1, icon: '🚜', name: 'Mahindra Tractor 35 HP', type: 'Tractor',
    pricePerDay: 1200, owner: 'Ravi Patil', village: 'Solapur, MH',
    specs: ['35 HP', '2WD', 'With Operator'], available: true,
  },
  {
    id: 2, icon: '🌾', name: 'Rotavator (Heavy Duty)', type: 'Tilling',
    pricePerDay: 600, owner: 'Suresh Yadav', village: 'Nashik, MH',
    specs: ['42 Blades', '6 ft Width'], available: true,
  },
  {
    id: 3, icon: '🌱', name: 'Seed Drill (7-Row)', type: 'Sowing',
    pricePerDay: 750, owner: 'Balram Singh', village: 'Amravati, MH',
    specs: ['7 Rows', 'Zero Till'], available: true,
  },
  {
    id: 4, icon: '💧', name: 'Power Sprayer (Engine)', type: 'Spraying',
    pricePerDay: 400, owner: 'Gita Devi', village: 'Nagpur, MH',
    specs: ['16L Tank', '3 HP Engine'], available: true,
  },
  {
    id: 5, icon: '🌿', name: 'Combine Harvester', type: 'Harvesting',
    pricePerDay: 4500, owner: 'Harpal Singh', village: 'Ludhiana, PB',
    specs: ['Self-Propelled', 'GPS Track'], available: false,
  },
  {
    id: 6, icon: '🔧', name: 'Thresher (Wheat/Rice)', type: 'Threshing',
    pricePerDay: 900, owner: 'Mohan Lal', village: 'Sangli, MH',
    specs: ['10 HP', '400 kg/hr'], available: true,
  },
  {
    id: 7, icon: '🏗️', name: 'Disc Plough (3-Disc)', type: 'Tilling',
    pricePerDay: 500, owner: 'Kamala Bai', village: 'Yavatmal, MH',
    specs: ['3 Disc', 'Tractor Mount'], available: true,
  },
  {
    id: 8, icon: '🚿', name: 'Pump Set (Diesel)', type: 'Irrigation',
    pricePerDay: 350, owner: 'Dinesh Patel', village: 'Aurangabad, MH',
    specs: ['5 HP', '1000 L/min'], available: true,
  },
  {
    id: 9, icon: '🌲', name: 'Mini Tiller / Power Weeder', type: 'Tilling',
    pricePerDay: 450, owner: 'Sita Ram', village: 'Pune, MH',
    specs: ['5 HP', 'Walk Behind'], available: false,
  },
  {
    id: 10, icon: '📦', name: 'Baler (Round Bale)', type: 'Post-Harvest',
    pricePerDay: 1100, owner: 'Vikram Desai', village: 'Kolhapur, MH',
    specs: ['Round Bale', 'Tractor PTO'], available: true,
  },
  {
    id: 11, icon: '🔬', name: 'Laser Land Leveller', type: 'Land Prep',
    pricePerDay: 2200, owner: 'Anil Sharma', village: 'Jaipur, RJ',
    specs: ['GPS Laser', 'High Accuracy'], available: true,
  },
  {
    id: 12, icon: '🚁', name: 'Drone Sprayer (10L)', type: 'Spraying',
    pricePerDay: 2800, owner: 'TechFarm Co.', village: 'Hyderabad, TS',
    specs: ['10L Tank', '1 acre/5 min', 'GPS Auto'], available: true,
  },
];

const EQUIPMENT_TYPES = ['All', 'Tractor', 'Tilling', 'Sowing', 'Spraying', 'Harvesting', 'Irrigation', 'Post-Harvest', 'Land Prep', 'Threshing'];

const EQUIPMENT_OPTIONS = [
  'Tractor', 'Rotavator', 'Seed Drill', 'Power Sprayer', 'Drone Sprayer',
  'Combine Harvester', 'Thresher', 'Disc Plough', 'Pump Set', 'Mini Tiller',
  'Laser Leveller', 'Baler', 'Cultivator', 'Ridger', 'Other',
];

/* ── Component ── */
const EquipmentRentalModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [filterType, setFilterType] = useState('All');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  /* Form state */
  const [form, setForm] = useState({
    equipmentType: '', customName: '', pricePerDay: '',
    phone: '', village: '', specs: '', availableFrom: '', availableTo: '',
  });

  const [equipmentList, setEquipmentList] = useState(() => {
    try {
      const saved = localStorage.getItem('annadata_rentals');
      if (saved) {
        return [...JSON.parse(saved), ...ALL_EQUIPMENT];
      }
    } catch (_) {}
    return ALL_EQUIPMENT;
  });

  /* Filtered listings */
  const filtered = useMemo(() => {
    return equipmentList.filter(eq => {
      const matchType = filterType === 'All' || eq.type === filterType;
      const matchAvail = !filterAvailable || eq.available;
      const matchSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          eq.village.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchAvail && matchSearch;
    });
  }, [equipmentList, filterType, filterAvailable, searchQuery]);

  const availableCount = equipmentList.filter(e => e.available).length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRequest = (eq) => {
    if (requestedIds.includes(eq.id)) return;
    setRequestedIds(prev => [...prev, eq.id]);
    showToast(`✅ Request sent to ${eq.owner} for ${eq.name}!`);
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newEquipment = {
      id: Date.now(),
      icon: form.equipmentType === 'Tractor' ? '🚜' : (form.equipmentType === 'Spraying' ? '💧' : '🔧'),
      name: form.customName || form.equipmentType,
      type: form.equipmentType || 'Other',
      pricePerDay: Number(form.pricePerDay) || 800,
      owner: 'You (Owner)',
      village: form.village || 'Local Village',
      specs: form.specs ? form.specs.split(',').map(s => s.trim()) : ['Verified', 'Ready to rent'],
      available: true
    };

    const updated = [newEquipment, ...equipmentList];
    setEquipmentList(updated);
    try {
      const userCustomOnly = updated.filter(item => typeof item.id === 'number' && item.id > 100);
      localStorage.setItem('annadata_rentals', JSON.stringify(userCustomOnly));
    } catch (_) {}

    setFormSuccess(true);
    showToast('🎉 Your equipment has been listed and is now visible in the catalog!');
    setForm({
      equipmentType: '', customName: '', pricePerDay: '',
      phone: '', village: '', specs: '', availableFrom: '', availableTo: '',
    });
    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab('browse');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="rental-overlay" onClick={onClose}>
        <div className="rental-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="rental-header">
            <div className="rental-header-left">
              <h2>🚜 Farm Equipment Rental</h2>
              <p>Rent tools from nearby farmers · List your own equipment</p>
            </div>
            <button className="rental-close-btn" onClick={onClose}>✕ Close</button>
          </div>

          {/* Stats Bar */}
          <div className="rental-stats-bar">
            <div className="rental-stat">
              <span>🚜</span>
              <span>Total Listings:</span>
              <span className="stat-count">{ALL_EQUIPMENT.length}</span>
            </div>
            <div className="rental-stat">
              <span>✅</span>
              <span>Available Now:</span>
              <span className="stat-count">{availableCount}</span>
            </div>
            <div className="rental-stat">
              <span>📍</span>
              <span>Nearby (within 50 km)</span>
            </div>
            <div className="rental-stat">
              <span>💰</span>
              <span>From ₹350/day</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="rental-tabs">
            <button
              className={`rental-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              🔍 Browse Rentals
            </button>
            <button
              className={`rental-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 List My Equipment
            </button>
          </div>

          {/* Body */}
          <div className="rental-body">

            {/* ── BROWSE TAB ── */}
            {activeTab === 'browse' && (
              <>
                {/* Filters */}
                <div className="rental-filters">
                  <input
                    type="text"
                    className="rental-search-input"
                    placeholder="🔍 Search equipment or location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button
                    className={`filter-chip ${filterAvailable ? 'active' : ''}`}
                    onClick={() => setFilterAvailable(prev => !prev)}
                  >
                    ✅ Available Only
                  </button>
                </div>

                {/* Type filter chips */}
                <div className="rental-filters" style={{ marginBottom: '1.2rem' }}>
                  {EQUIPMENT_TYPES.map(type => (
                    <button
                      key={type}
                      className={`filter-chip ${filterType === type ? 'active' : ''}`}
                      onClick={() => setFilterType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Equipment Grid */}
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 600 }}>
                    No equipment found. Try adjusting your filters.
                  </div>
                ) : (
                  <div className="equipment-grid">
                    {filtered.map(eq => (
                      <div key={eq.id} className="equipment-card">
                        <div className="eq-card-top">
                          <div className="eq-icon-name">
                            <span className="eq-icon">{eq.icon}</span>
                            <div>
                              <div className="eq-name">{eq.name}</div>
                              <div className="eq-type-badge">{eq.type}</div>
                            </div>
                          </div>
                          <div className="eq-price-badge">₹{eq.pricePerDay}/day</div>
                        </div>

                        <div className="eq-owner-info">
                          <div className="eq-owner-name">👤 {eq.owner}</div>
                          <div className="eq-location">📍 {eq.village}</div>
                        </div>

                        <div className="eq-specs">
                          {eq.specs.map((s, i) => (
                            <span key={i} className="eq-spec-chip">{s}</span>
                          ))}
                        </div>

                        <div className="eq-card-footer">
                          <span className={`availability-chip ${eq.available ? 'available' : 'booked'}`}>
                            {eq.available ? '● Available' : '● Booked'}
                          </span>
                          <button
                            className={`request-btn ${requestedIds.includes(eq.id) ? 'requested' : ''}`}
                            onClick={() => handleRequest(eq)}
                            disabled={!eq.available}
                          >
                            {requestedIds.includes(eq.id) ? '✓ Requested' : 'Request →'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── LIST TAB ── */}
            {activeTab === 'list' && (
              <div className="list-form-container">
                {formSuccess ? (
                  <div className="form-success">
                    <div className="success-icon">🎉</div>
                    <h3>Equipment Listed Successfully!</h3>
                    <p>Other farmers in your area can now see and request your equipment.</p>
                  </div>
                ) : (
                  <>
                    <div className="list-form-title">List Your Equipment for Rent</div>
                    <div className="list-form-subtitle">
                      Fill in the details below. Nearby farmers will be able to request your equipment directly.
                    </div>
                    <form onSubmit={handleFormSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="equipmentType">Equipment Type *</label>
                          <select
                            id="equipmentType"
                            name="equipmentType"
                            value={form.equipmentType}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">-- Select Type --</option>
                            {EQUIPMENT_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="customName">Equipment Name / Model</label>
                          <input
                            id="customName"
                            name="customName"
                            type="text"
                            placeholder="e.g. Mahindra 475 DI"
                            value={form.customName}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="pricePerDay">Rental Price (₹/day) *</label>
                          <input
                            id="pricePerDay"
                            name="pricePerDay"
                            type="number"
                            placeholder="e.g. 1200"
                            value={form.pricePerDay}
                            onChange={handleFormChange}
                            min="1"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="phone">Contact Number *</label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="10-digit mobile"
                            value={form.phone}
                            onChange={handleFormChange}
                            pattern="[0-9]{10}"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="availableFrom">Available From</label>
                          <input
                            id="availableFrom"
                            name="availableFrom"
                            type="date"
                            value={form.availableFrom}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="availableTo">Available Until</label>
                          <input
                            id="availableTo"
                            name="availableTo"
                            type="date"
                            value={form.availableTo}
                            onChange={handleFormChange}
                          />
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="village">Village / Town *</label>
                          <input
                            id="village"
                            name="village"
                            type="text"
                            placeholder="e.g. Nashik, Maharashtra"
                            value={form.village}
                            onChange={handleFormChange}
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="specs">Specifications / Additional Details</label>
                          <textarea
                            id="specs"
                            name="specs"
                            placeholder="e.g. 35 HP, with operator available, good condition..."
                            value={form.specs}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>

                      <button type="submit" className="form-submit-btn">
                        🚜 List My Equipment
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="rental-toast">{toast}</div>}
    </>
  );
};

export default EquipmentRentalModal;
