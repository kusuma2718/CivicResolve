import { Complaint } from '../types';

export const INITIAL_MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'CR-2024-1042',
    title: 'Hazardous deep pothole on MG Road Junction',
    description: 'A 2-foot wide and 8-inch deep pothole near the metro station exit is causing severe traffic bottlenecks and two-wheeler accidents during peak hours.',
    category: 'Roads and Potholes',
    priority: 'Critical',
    status: 'In Progress',
    location: 'Near Gate 2, Central Metro Station, MG Road',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-18T09:30:00Z',
    updatedAt: '2024-11-19T14:20:00Z',
    department: 'Public Works Department (PWD)',
    assignedOfficer: 'Er. Rajesh Verma (Divisional Engineer)',
    isSample: true,
    timeline: [
      {
        id: 'tl-1',
        title: 'Complaint Registered',
        description: 'Issue reported by citizen with geo-tagged coordinates and photographic evidence.',
        timestamp: '2024-11-18T09:30:00Z',
        status: 'Reported',
        actor: 'Citizen Portal',
        notes: 'Citizen provided high-resolution image showing dangerous road depression.'
      },
      {
        id: 'tl-2',
        title: 'Automated Triaging & Department Assignment',
        description: 'Auto-routed to Roads & Infrastructure division based on category and priority criteria.',
        timestamp: '2024-11-18T09:32:00Z',
        status: 'Under Review',
        actor: 'Municipal Dispatch System',
        notes: 'Priority elevated to Critical due to high vehicular traffic volume.'
      },
      {
        id: 'tl-3',
        title: 'Field Team Dispatched for Inspection',
        description: 'PWD Road Repair Team #4 inspected the spot and initiated asphalt patching groundwork.',
        timestamp: '2024-11-19T14:20:00Z',
        status: 'In Progress',
        actor: 'Er. Rajesh Verma (PWD)',
        notes: 'Patching work scheduled for nighttime hours (11 PM - 4 AM) to minimize traffic disruption.'
      }
    ]
  },
  {
    id: 'CR-2024-1039',
    title: 'Overflowing community garbage dump near Sector 7 Market',
    description: 'Garbage has not been collected for the last 4 days. Waste is spilling onto the pedestrian sidewalk creating foul smell and stray animal menace.',
    category: 'Garbage and Sanitation',
    priority: 'High',
    status: 'Reported',
    location: 'Sector 7 Central Commercial Market, Behind Block C',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Priya Narang',
    email: 'priya.n@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-20T08:15:00Z',
    updatedAt: '2024-11-20T08:15:00Z',
    department: 'Municipal Sanitation Department',
    assignedOfficer: 'Pending Assignment',
    isSample: true,
    timeline: [
      {
        id: 'tl-4',
        title: 'Complaint Registered',
        description: 'Citizen report received with location verification.',
        timestamp: '2024-11-20T08:15:00Z',
        status: 'Reported',
        actor: 'Citizen Portal',
        notes: 'Pending initial review by ward sanitary inspector.'
      }
    ]
  },
  {
    id: 'CR-2024-1025',
    title: 'Damaged main pipeline causing clean drinking water leakage',
    description: 'Underground pipeline burst on 4th Cross Road. Thousands of liters of potable water are flowing into the storm drain for 18 hours.',
    category: 'Water Supply and Leakage',
    priority: 'Critical',
    status: 'Resolved',
    location: '4th Cross Road, Indiranagar 2nd Stage',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Vikramaditya Bose',
    email: 'v.bose@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-15T07:10:00Z',
    updatedAt: '2024-11-16T18:45:00Z',
    department: 'Water & Sewage Management Board',
    assignedOfficer: 'S. K. Kulkarni (Chief Water Inspector)',
    isSample: true,
    timeline: [
      {
        id: 'tl-5',
        title: 'Complaint Registered',
        description: 'Urgent notification received regarding main pipeline burst.',
        timestamp: '2024-11-15T07:10:00Z',
        status: 'Reported',
        actor: 'Citizen Portal'
      },
      {
        id: 'tl-6',
        title: 'Emergency Valve Isolated',
        description: 'Upstream isolation valve shut to prevent water loss while repair crew mobilized.',
        timestamp: '2024-11-15T09:00:00Z',
        status: 'In Progress',
        actor: 'Water Board Rapid Response Team'
      },
      {
        id: 'tl-7',
        title: 'Pipe Section Replaced & Pressure Tested',
        description: 'Defective cast iron joint replaced with high-density poly pipe. Normal pressure restored.',
        timestamp: '2024-11-16T18:45:00Z',
        status: 'Resolved',
        actor: 'S. K. Kulkarni',
        notes: 'Post-repair water purity and pressure verified satisfactory.'
      }
    ]
  },
  {
    id: 'CR-2024-1018',
    title: 'Dark residential street: 6 consecutive streetlights not functioning',
    description: 'Streetlights from Pole #14 to #20 on Greenfield Avenue have been completely unlit for the past week, creating safety concerns for pedestrians at night.',
    category: 'Streetlights and Electricity',
    priority: 'Medium',
    status: 'In Progress',
    location: 'Greenfield Avenue, Between 8th and 10th Main',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-16T19:40:00Z',
    updatedAt: '2024-11-18T11:15:00Z',
    department: 'Electricity & Streetlight Board',
    assignedOfficer: 'Ramesh Babu (Lineman Supervisor)',
    isSample: true,
    timeline: [
      {
        id: 'tl-8',
        title: 'Complaint Registered',
        description: 'Reported by local resident association representative.',
        timestamp: '2024-11-16T19:40:00Z',
        status: 'Reported',
        actor: 'Citizen Portal'
      },
      {
        id: 'tl-9',
        title: 'Feeder Pillar Inspection',
        description: 'Underground cable short-circuit identified at junction box B-12.',
        timestamp: '2024-11-18T11:15:00Z',
        status: 'In Progress',
        actor: 'Electricity Board Service Crew',
        notes: 'Replacement cable ordered; installation underway.'
      }
    ]
  },
  {
    id: 'CR-2024-0995',
    title: 'Clogged storm drain causing severe road flooding during rain',
    description: 'Stormwater drain is filled with construction debris and silt. Even moderate rain leads to waterlogging up to knee height near the bus terminal.',
    category: 'Drainage and Sewage',
    priority: 'High',
    status: 'Under Review',
    location: 'Opposite City Central Bus Stand, Station Road',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Karthik Raman',
    email: 'karthik.r@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-19T16:00:00Z',
    updatedAt: '2024-11-20T10:30:00Z',
    department: 'Water & Sewage Management Board',
    assignedOfficer: 'Er. N. Manjunath',
    isSample: true,
    timeline: [
      {
        id: 'tl-10',
        title: 'Complaint Registered',
        description: 'Report submitted along with photographs of submerged sidewalk.',
        timestamp: '2024-11-19T16:00:00Z',
        status: 'Reported',
        actor: 'Citizen Portal'
      },
      {
        id: 'tl-11',
        title: 'Preliminary Assessment',
        description: 'Assigned to desilting wing. Mechanical excavator requested for debris removal.',
        timestamp: '2024-11-20T10:30:00Z',
        status: 'Under Review',
        actor: 'Er. N. Manjunath',
        notes: 'Scheduled for action within 48 hours.'
      }
    ]
  },
  {
    id: 'CR-2024-0982',
    title: 'Broken safety railing on pedestrian overpass',
    description: 'Metal guard rail on the school pedestrian bridge has snapped off. It poses an immediate falling danger for school children crossing daily.',
    category: 'Public Infrastructure',
    priority: 'Critical',
    status: 'Resolved',
    location: 'Pedestrian Skywalk, Near Govt Higher Secondary School',
    city: 'Metro City',
    state: 'Karnataka',
    citizenName: 'Sneha Patel',
    email: 'sneha.patel@example.com',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    createdAt: '2024-11-12T11:00:00Z',
    updatedAt: '2024-11-14T16:20:00Z',
    department: 'Public Works Department (PWD)',
    assignedOfficer: 'Er. Anand Rao',
    isSample: true,
    timeline: [
      {
        id: 'tl-12',
        title: 'Complaint Registered',
        description: 'Urgent safety hazard flagged by school principal.',
        timestamp: '2024-11-12T11:00:00Z',
        status: 'Reported',
        actor: 'Citizen Portal'
      },
      {
        id: 'tl-13',
        title: 'Barricade Erected & Welding Crew Deployed',
        description: 'Temporary wooden barrier set up immediately, followed by heavy structural welding.',
        timestamp: '2024-11-13T09:30:00Z',
        status: 'In Progress',
        actor: 'PWD Emergency Works Division'
      },
      {
        id: 'tl-14',
        title: 'New Reinforced Steel Barrier Installed',
        description: 'Welding completed, safety load tested, and painted with reflective yellow warning stripes.',
        timestamp: '2024-11-14T16:20:00Z',
        status: 'Resolved',
        actor: 'Er. Anand Rao'
      }
    ]
  }
];

export const MOCK_STATISTICS = {
  totalIssuesReported: 14850,
  resolvedIssues: 12420,
  activeDepartments: 28,
  avgResolutionTimeHours: 36,
  satisfactionRate: 94.8,
  citiesCovered: 16
};
