import { db } from './index.js';
import { PasswordService } from '../services/passwordService.js';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      division TEXT,
      contact_email TEXT NOT NULL,
      contact_phone TEXT,
      sla_hours INTEGER NOT NULL DEFAULT 48,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'officer', 'admin')),
      preferred_language TEXT NOT NULL DEFAULT 'en',
      department_id TEXT,
      password_hash TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      translated_description TEXT,
      original_language TEXT NOT NULL DEFAULT 'en',
      citizen_preferred_language TEXT NOT NULL DEFAULT 'en',
      category TEXT NOT NULL,
      subcategory TEXT,
      priority TEXT NOT NULL CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')),
      severity_score REAL,
      department_id TEXT NOT NULL,
      department_name TEXT NOT NULL,
      division TEXT,
      status TEXT NOT NULL CHECK(status IN ('Reported', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
      image_url TEXT,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      community_impact_score INTEGER NOT NULL DEFAULT 0,
      duplicate_of_id TEXT,
      repeat_issue_id TEXT,
      citizen_name TEXT NOT NULL,
      citizen_email TEXT NOT NULL,
      citizen_phone TEXT,
      assigned_officer TEXT,
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
      FOREIGN KEY (duplicate_of_id) REFERENCES complaints(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS complaint_timeline (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL DEFAULT 'System',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      complaint_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('status_update', 'assignment', 'alert', 'general')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploaded_images (
      id TEXT PRIMARY KEY,
      complaint_id TEXT,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS location_history (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      landmark TEXT,
      ward TEXT,
      pincode TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sla_escalations (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      escalation_level INTEGER NOT NULL CHECK(escalation_level IN (1, 2, 3)),
      hours_overdue REAL NOT NULL,
      target_officer_role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Acknowledged', 'Resolved')),
      acknowledged_at TEXT,
      acknowledged_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS department_sla_rules (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')),
      target_hours INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      UNIQUE(department_id, priority)
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
    CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
    CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
    CREATE INDEX IF NOT EXISTS idx_timeline_complaint ON complaint_timeline(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_sla_escalations_complaint ON sla_escalations(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_sla_escalations_dept ON sla_escalations(department_id);
  `);

  // Migrate password_hash column if missing in existing database files
  try {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  } catch {
    // Column already exists
  }

  seedInitialData();
  seedPhase4Data();
}

function seedInitialData() {
  const now = new Date().toISOString();

  // Provision initial administrative and officer accounts with hashed passwords
  const adminUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get('admin@civicresolve.gov.in');
  if (!adminUser) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, role, preferred_language, department_id, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-admin-system',
      'CivicResolve System Administrator',
      'admin@civicresolve.gov.in',
      '+91 8000000001',
      'admin',
      'en',
      null,
      PasswordService.hashPassword('Admin@Civic2025!'),
      now
    );
  }

  const officerUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get('officer@civicresolve.gov.in');
  if (!officerUser) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, role, preferred_language, department_id, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-officer-console',
      'Municipal Operations Duty Officer',
      'officer@civicresolve.gov.in',
      '+91 8000000002',
      'officer',
      'en',
      'dept-pwd',
      PasswordService.hashPassword('Officer@Civic2025!'),
      now
    );
  }

  const deptCount = (db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number }).count;
  if (deptCount === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (id, name, code, division, contact_email, contact_phone, sla_hours, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertDept.run('dept-pwd', 'Public Works Department (PWD)', 'PWD', 'Roads & Infrastructure', 'pwd.support@metro.gov.in', '080-2223401', 36, now);
    insertDept.run('dept-sanitation', 'Municipal Sanitation Department', 'MSD', 'Solid Waste Management', 'cleanliness@metro.gov.in', '080-2223402', 24, now);
    insertDept.run('dept-water', 'Water & Sewage Management Board', 'WSMB', 'Water Utilities & Sewerage', 'waterboard@metro.gov.in', '080-2223403', 24, now);
    insertDept.run('dept-electricity', 'Electricity & Streetlight Board', 'ESB', 'Urban Electrification', 'powergrid@metro.gov.in', '080-2223404', 36, now);
    insertDept.run('dept-traffic', 'Traffic Management Division', 'TMD', 'Traffic Flow & Safety', 'trafficops@metro.gov.in', '080-2223405', 48, now);
    insertDept.run('dept-admin', 'General Municipal Administration', 'GMA', 'Civic Affairs', 'grievances@metro.gov.in', '080-2223400', 48, now);
  }

  const complaintCount = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as { count: number }).count;
  if (complaintCount === 0) {
    const insertComplaint = db.prepare(`
      INSERT INTO complaints (
        id, title, description, translated_description, original_language, citizen_preferred_language,
        category, subcategory, priority, severity_score, department_id, department_name, division,
        status, image_url, location, city, state, latitude, longitude, community_impact_score,
        duplicate_of_id, repeat_issue_id, citizen_name, citizen_email, citizen_phone, assigned_officer,
        is_sample, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const insertTimeline = db.prepare(`
      INSERT INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sample 1: Pothole
    insertComplaint.run(
      'CR-2024-1042',
      'Hazardous deep pothole on MG Road Junction',
      'A 2-foot wide and 8-inch deep pothole near the metro station exit is causing severe traffic bottlenecks and two-wheeler accidents during peak hours.',
      null, 'en', 'en',
      'Roads and Potholes', 'Road Surface Fracture', 'Critical', 8.5,
      'dept-pwd', 'Public Works Department (PWD)', 'Roads & Infrastructure',
      'In Progress',
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      'Near Gate 2, Central Metro Station, MG Road', 'Metro City', 'Karnataka',
      12.9716, 77.5946, 78,
      null, null,
      'Aarav Sharma', 'aarav.sharma@example.com', '+91 9876543210', 'Er. Rajesh Verma (Divisional Engineer)',
      1, '2024-11-18T09:30:00Z', '2024-11-19T14:20:00Z'
    );
    insertTimeline.run('tl-101', 'CR-2024-1042', 'Reported', 'Complaint Registered', 'Issue reported by citizen with geo-tagged coordinates.', 'Citizen Portal', 'Citizen', 'Initial citizen filing', '2024-11-18T09:30:00Z');
    insertTimeline.run('tl-102', 'CR-2024-1042', 'Under Review', 'Automated Triaging & Department Assignment', 'Auto-routed to Roads & Infrastructure division based on category and priority criteria.', 'Municipal Dispatch System', 'System', 'Priority elevated to Critical due to heavy traffic volume', '2024-11-18T09:32:00Z');
    insertTimeline.run('tl-103', 'CR-2024-1042', 'In Progress', 'Field Team Dispatched for Inspection', 'PWD Road Repair Team #4 inspected spot and initiated asphalt patching.', 'Er. Rajesh Verma', 'PWD Officer', 'Patching work scheduled for nighttime hours (11 PM - 4 AM)', '2024-11-19T14:20:00Z');

    // Sample 2: Garbage
    insertComplaint.run(
      'CR-2024-1039',
      'Overflowing community garbage dump near Sector 7 Market',
      'Garbage has not been collected for the last 4 days. Waste is spilling onto the pedestrian sidewalk creating foul smell and stray animal menace.',
      null, 'en', 'en',
      'Garbage and Sanitation', 'Solid Waste Accumulation', 'High', 7.2,
      'dept-sanitation', 'Municipal Sanitation Department', 'Solid Waste Management',
      'Reported',
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
      'Sector 7 Central Commercial Market, Behind Block C', 'Metro City', 'Karnataka',
      12.9352, 77.6245, 65,
      null, null,
      'Priya Narang', 'priya.n@example.com', '+91 9876543211', 'Pending Assignment',
      1, '2024-11-20T08:15:00Z', '2024-11-20T08:15:00Z'
    );
    insertTimeline.run('tl-104', 'CR-2024-1039', 'Reported', 'Complaint Registered', 'Citizen report received with location verification.', 'Citizen Portal', 'Citizen', 'Pending initial review by ward sanitary inspector.', '2024-11-20T08:15:00Z');

    // Sample 3: Water Leakage (Resolved)
    insertComplaint.run(
      'CR-2024-1025',
      'Damaged main pipeline causing clean drinking water leakage',
      'Underground pipeline burst on 4th Cross Road. Thousands of liters of potable water are flowing into storm drain.',
      null, 'en', 'en',
      'Water Supply and Leakage', 'Water Main Burst', 'Critical', 9.1,
      'dept-water', 'Water & Sewage Management Board', 'Water Utilities & Sewerage',
      'Resolved',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80',
      '4th Cross Road, Indiranagar 2nd Stage', 'Metro City', 'Karnataka',
      12.9784, 77.6408, 92,
      null, null,
      'Vikramaditya Bose', 'v.bose@example.com', '+91 9876543212', 'S. K. Kulkarni (Chief Water Inspector)',
      1, '2024-11-15T07:10:00Z', '2024-11-16T18:45:00Z'
    );
    insertTimeline.run('tl-105', 'CR-2024-1025', 'Reported', 'Complaint Registered', 'Urgent notification received regarding main pipeline burst.', 'Citizen Portal', 'Citizen', null, '2024-11-15T07:10:00Z');
    insertTimeline.run('tl-106', 'CR-2024-1025', 'In Progress', 'Emergency Valve Isolated', 'Upstream isolation valve shut to prevent water loss while repair crew mobilized.', 'Water Board Rapid Response Team', 'Field Crew', null, '2024-11-15T09:00:00Z');
    insertTimeline.run('tl-107', 'CR-2024-1025', 'Resolved', 'Pipe Section Replaced & Pressure Tested', 'Defective cast iron joint replaced with high-density poly pipe. Normal pressure restored.', 'S. K. Kulkarni', 'Chief Inspector', 'Post-repair water purity and pressure verified satisfactory.', '2024-11-16T18:45:00Z');

    // Sample 4: Streetlight
    insertComplaint.run(
      'CR-2024-1018',
      'Dark residential street: 6 consecutive streetlights not functioning',
      'Streetlights from Pole #14 to #20 on Greenfield Avenue have been completely unlit for the past week, creating safety concerns for pedestrians at night.',
      null, 'en', 'en',
      'Streetlights and Electricity', 'Feeder Cable Fault', 'Medium', 5.4,
      'dept-electricity', 'Electricity & Streetlight Board', 'Urban Electrification',
      'In Progress',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      'Greenfield Avenue, Between 8th and 10th Main', 'Metro City', 'Karnataka',
      12.9279, 77.6271, 45,
      null, null,
      'Meera Iyer', 'meera.iyer@example.com', '+91 9876543213', 'Ramesh Babu (Lineman Supervisor)',
      1, '2024-11-16T19:40:00Z', '2024-11-18T11:15:00Z'
    );
    insertTimeline.run('tl-108', 'CR-2024-1018', 'Reported', 'Complaint Registered', 'Reported by local resident association representative.', 'Citizen Portal', 'Citizen', null, '2024-11-16T19:40:00Z');
    insertTimeline.run('tl-109', 'CR-2024-1018', 'In Progress', 'Feeder Pillar Inspection', 'Underground cable short-circuit identified at junction box B-12.', 'Electricity Board Service Crew', 'Service Crew', 'Replacement cable ordered; installation underway.', '2024-11-18T11:15:00Z');
  }
}

function seedPhase4Data() {
  const now = new Date().toISOString();

  // 1. Seed Department SLA Rules
  const slaRuleCount = (db.prepare('SELECT COUNT(*) as count FROM department_sla_rules').get() as { count: number }).count;
  if (slaRuleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO department_sla_rules (id, department_id, priority, target_hours, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const rules = [
      { dept: 'dept-pwd', critical: 18, high: 36, medium: 72, low: 120 },
      { dept: 'dept-sanitation', critical: 12, high: 24, medium: 48, low: 96 },
      { dept: 'dept-water', critical: 12, high: 24, medium: 48, low: 72 },
      { dept: 'dept-electricity', critical: 8, high: 24, medium: 48, low: 72 },
      { dept: 'dept-traffic', critical: 12, high: 24, medium: 48, low: 96 },
      { dept: 'dept-admin', critical: 24, high: 48, medium: 72, low: 144 },
    ];

    rules.forEach((r) => {
      insertRule.run(`sla-${r.dept}-critical`, r.dept, 'Critical', r.critical, now);
      insertRule.run(`sla-${r.dept}-high`, r.dept, 'High', r.high, now);
      insertRule.run(`sla-${r.dept}-medium`, r.dept, 'Medium', r.medium, now);
      insertRule.run(`sla-${r.dept}-low`, r.dept, 'Low', r.low, now);
    });
  }

  // 2. Seed Realistic Phase 4 Sample Complaints (Idempotent by ID)
  const insertComplaint = db.prepare(`
    INSERT OR IGNORE INTO complaints (
      id, title, description, translated_description, original_language, citizen_preferred_language,
      category, subcategory, priority, severity_score, department_id, department_name, division,
      status, image_url, location, city, state, latitude, longitude, community_impact_score,
      duplicate_of_id, repeat_issue_id, citizen_name, citizen_email, citizen_phone, assigned_officer,
      is_sample, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertTimeline = db.prepare(`
    INSERT OR IGNORE INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Historical Resolved 1 (PWD) - Creates repeat-issue base at MG Road Junction!
  insertComplaint.run(
    'CR-2024-1008',
    'Severe road depression and potholes on MG Road Metro Gate 2',
    'Multiple deep surface craters near metro pillar 140 were causing bike skids. Patched with asphalt.',
    null, 'en', 'en',
    'Roads and Potholes', 'Road Surface Fracture', 'High', 7.5,
    'dept-pwd', 'Public Works Department (PWD)', 'Roads & Infrastructure',
    'Resolved',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    'Near Gate 2, Central Metro Station, MG Road', 'Metro City', 'Karnataka',
    12.9716, 77.5946, 72,
    null, null,
    'Rohan Kulkarni', 'rohan.k@example.com', '+91 9876543201', 'Er. Rajesh Verma',
    1, '2024-10-10T10:00:00Z', '2024-10-11T12:00:00Z'
  );

  // Historical Resolved 2 (PWD) - Adds data for predictive resolution
  insertComplaint.run(
    'CR-2024-1012',
    'Sunken utility trench on 80 Feet Road Koramangala',
    'Unrestored utility trench after fiber laying was creating severe vehicular obstruction. Restored and leveled.',
    null, 'en', 'en',
    'Roads and Potholes', 'Trench Subsidence', 'Medium', 6.0,
    'dept-pwd', 'Public Works Department (PWD)', 'Roads & Infrastructure',
    'Resolved',
    null,
    '80 Feet Road, 4th Block Koramangala', 'Metro City', 'Karnataka',
    12.9350, 77.6200, 58,
    null, null,
    'Ananya Sen', 'ananya.s@example.com', '+91 9876543202', 'Er. Rajesh Verma',
    1, '2024-10-15T08:30:00Z', '2024-10-16T16:30:00Z'
  );

  // Historical Resolved 3 (Sanitation) - Adds data for predictive resolution
  insertComplaint.run(
    'CR-2024-1020',
    'Accumulated dry waste and plastic littering on Commercial Street',
    'Festival shopping weekend resulted in uncollected commercial garbage along the primary sidewalk.',
    null, 'en', 'en',
    'Garbage and Sanitation', 'Commercial Waste Backlog', 'Medium', 5.5,
    'dept-sanitation', 'Municipal Sanitation Department', 'Solid Waste Management',
    'Resolved',
    null,
    'Commercial Street Main Bazaar Entrance', 'Metro City', 'Karnataka',
    12.9822, 77.6083, 50,
    null, null,
    'Farhan Akhtar', 'farhan.a@example.com', '+91 9876543203', 'Sanitary Inspector B. Rao',
    1, '2024-10-22T06:00:00Z', '2024-10-22T22:00:00Z'
  );

  // Potential Duplicate of CR-2024-1042 (Pothole at MG Road Gate 2)
  insertComplaint.run(
    'CR-2024-1048',
    'Huge dangerous pothole right outside central metro station gate 2',
    'Massive open crater on the road outside metro gate 2. Vehicles are swerving into oncoming traffic to dodge it.',
    null, 'en', 'en',
    'Roads and Potholes', 'Pothole on main road', 'Critical', 8.7,
    'dept-pwd', 'Public Works Department (PWD)', 'Roads & Infrastructure',
    'Reported',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    'MG Road Metro Station Gate 2 exit', 'Metro City', 'Karnataka',
    12.9718, 77.5948, 85,
    null, null,
    'Sunil Gavaskar', 'sunil.g@example.com', '+91 9876543204', 'Pending Allocation',
    1, '2024-11-19T11:00:00Z', '2024-11-19T11:00:00Z'
  );

  // Overdue SLA Alert (Sanitation - Created 5 days ago, Critical SLA breached!)
  const overdueCreated = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  insertComplaint.run(
    'CR-2024-1033',
    'Hazardous medical and bio-waste dumping behind Government Hospital',
    'Unregulated dumping of medical waste including used syringes and contaminated bandages near hospital perimeter. Poses grave public infection hazard.',
    null, 'en', 'en',
    'Garbage and Sanitation', 'Hazardous Medical Waste', 'Critical', 9.4,
    'dept-sanitation', 'Municipal Sanitation Department', 'Solid Waste Management',
    'Reported',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    'Victoria Hospital Boundary Road, Kalasipalya', 'Metro City', 'Karnataka',
    12.9620, 77.5750, 94,
    null, null,
    'Dr. K. N. Rao', 'knrao@example.com', '+91 9876543205', 'Chief Health Officer',
    1, overdueCreated, overdueCreated
  );

  // Approaching SLA Deadline (Electricity - 20h elapsed on 24h deadline)
  const approachingCreated = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  insertComplaint.run(
    'CR-2024-1055',
    'Blinding flickering high-mast floodlight array on Outer Ring Road',
    'Short-circuiting halogen high-mast fixture on the flyover approach is causing hazardous sudden glare for night drivers.',
    null, 'en', 'en',
    'Streetlights and Electricity', 'High-Mast Luminaire Short', 'High', 7.8,
    'dept-electricity', 'Electricity & Streetlight Board', 'Urban Electrification',
    'Under Review',
    null,
    'Bellandur Flyover Ascent, Outer Ring Road', 'Metro City', 'Karnataka',
    12.9304, 77.6784, 68,
    null, null,
    'Vipin Nair', 'vipin.n@example.com', '+91 9876543206', 'Ramesh Babu',
    1, approachingCreated, approachingCreated
  );

  // Drainage and Sewage in Jayanagar
  insertComplaint.run(
    'CR-2024-1061',
    'Cracked and collapsed stormwater drain concrete slab near bus terminal',
    'Heavy concrete cover over drain collapsed under vehicle weight, leaving a 4-foot deep open pit on pedestrian walkway.',
    null, 'en', 'en',
    'Drainage and Sewage', 'Collapsed Drain Slab', 'High', 7.4,
    'dept-water', 'Water & Sewage Management Board', 'Water Utilities & Sewerage',
    'Reported',
    null,
    'Jayanagar 4th Block, Adjacent to Bus Terminal', 'Metro City', 'Karnataka',
    12.9308, 77.5838, 64,
    null, null,
    'Suma Bharadwaj', 'suma.b@example.com', '+91 9876543207', 'Pending Assignment',
    1, '2024-11-20T14:00:00Z', '2024-11-20T14:00:00Z'
  );

  // Traffic & Transportation at Silk Board Junction
  insertComplaint.run(
    'CR-2024-1072',
    'Traffic signal controller locked in amber flash at major intersection',
    'Automated signal controller failed at peak junction causing gridlock across four arterial directions.',
    null, 'en', 'en',
    'Traffic and Transportation', 'Traffic Signal Controller Failure', 'Critical', 8.8,
    'dept-traffic', 'Traffic Management Division', 'Traffic Flow & Safety',
    'In Progress',
    null,
    'Silk Board Junction, Hosur Road Crossing', 'Metro City', 'Karnataka',
    12.9176, 77.6238, 88,
    null, null,
    'Inspector C. M. Patil', 'patil.cm@example.com', '+91 9876543208', 'Traffic Ops Flying Squad #2',
    1, '2024-11-21T06:30:00Z', '2024-11-21T07:15:00Z'
  );

  // Public Infrastructure in Malleshwaram
  insertComplaint.run(
    'CR-2024-1066',
    'Uprooted tree branches entangled with pedestrian bridge railings',
    'Storm damage caused large branches to break and hang dangerously over pedestrian foot overbridge.',
    null, 'en', 'en',
    'Public Infrastructure', 'Urban Forestry Hazard', 'Medium', 5.6,
    'dept-pwd', 'Public Works Department (PWD)', 'Public Civil Assets',
    'Reported',
    null,
    'Malleshwaram 8th Cross Foot Overbridge', 'Metro City', 'Karnataka',
    12.9982, 77.5714, 48,
    null, null,
    'Girish Karnad', 'girish.k@example.com', '+91 9876543209', 'Pending Allocation',
    1, '2024-11-20T18:00:00Z', '2024-11-20T18:00:00Z'
  );

  // Unmapped complaint without coordinates (tests missing coordinates handling!)
  insertComplaint.run(
    'CR-2024-1080',
    'Intermittent brown water turbidity in residential overhead lines',
    'Water supplied from municipal line is cloudy and has muddy sediment for the past two mornings.',
    null, 'en', 'en',
    'Water Supply and Leakage', 'Water Contamination / Turbidity', 'Medium', 5.0,
    'dept-water', 'Water & Sewage Management Board', 'Water Utilities & Sewerage',
    'Reported',
    null,
    'HSR Layout Sector 2, 14th Main Road (No GPS tagged)', 'Metro City', 'Karnataka',
    null, null, 42,
    null, null,
    'Kavita Reddy', 'kavita.r@example.com', '+91 9876543210', 'Pending Allocation',
    1, '2024-11-21T07:00:00Z', '2024-11-21T07:00:00Z'
  );
}
