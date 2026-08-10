'use client'

import { useState } from 'react'

export interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  column: 1 | 2 | 3
  row: number
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'gowtham',
    name: 'BM Gowtham',
    role: 'Chief Executive Officer',
    image: '/api/team-photo/gowtham',
    column: 1,
    row: 1,
  },
  {
    id: 'niyati',
    name: 'Niyati R',
    role: 'Chief Technical Officer',
    image: '/api/team-photo/niyati',
    column: 2,
    row: 1,
  },
  {
    id: 'shreyas',
    name: 'Shreyas D J',
    role: 'Head of External Affairs',
    image: '/api/team-photo/shreyas',
    column: 3,
    row: 2,
  },
  {
    id: 'rahul',
    name: 'Rahul B S',
    role: 'Founding Software Engineer',
    image: '/api/team-photo/rahul',
    column: 3,
    row: 1,
  },
]

interface TeamShowcaseProps {
  members?: TeamMember[]
}

export default function TeamShowcase({ members = DEFAULT_MEMBERS }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const col1 = members.filter(m => m.column === 1).sort((a, b) => a.row - b.row)
  const col2 = members.filter(m => m.column === 2).sort((a, b) => a.row - b.row)
  const col3 = members.filter(m => m.column === 3).sort((a, b) => a.row - b.row)

  return (
    <>
      <style>{`
        .team-container { display: flex; gap: 20px; width: 100%; margin: 0; padding: 32px 16px; flex-wrap: nowrap; justify-content: space-between; }
        @media (min-width: 769px) {
          .team-container { width: 100vw; margin-left: calc(-50vw + 50%); padding: 48px 8vw; gap: 30px; justify-content: space-around; flex-wrap: nowrap; }
        }
        .team-column { display: flex; flex-direction: column; gap: 24px; }
        .team-column-1 { flex: 0 0 auto; width: 280px; }
        .team-column-2 { flex: 0 0 auto; width: 280px; margin-top: 200px; }
        .team-column-3 { flex: 0 0 auto; width: 280px; margin-top: 40px; }
        @media (max-width: 768px) {
          .team-container { gap: 16px; padding: 24px 12px; justify-content: flex-start; }
          .team-column { gap: 16px; }
          .team-column-1 { width: 100px; }
          .team-column-2 { width: 100px; margin-top: 85px !important; }
          .team-column-3 { width: 100px; margin-top: 20px !important; }
          .team-name { font-size: 12px; }
          .team-role { font-size: 10px; }
        }
        .team-card { width: 100% !important; max-width: 320px; aspect-ratio: 3/4; }
        .team-photo { width: 100% !important; height: 100% !important; object-fit: cover; border-radius: 8px; }
        .team-name { font-size: 16px; font-weight: 600; margin-top: 14px; color: #1a1a1a; }
        .team-role { font-size: 14px; color: #666; margin-top: 6px; }
      `}</style>

      <div className="team-container">
        {/* Column 1: Gowtham */}
        <div className="team-column team-column-1">
          {col1.map((member) => (
            <div
              key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <div className="team-card">
                <img
                  src={member.image}
                  alt={member.name}
                  className="team-photo"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    filter: hoveredId === member.id
                      ? 'grayscale(0) brightness(1)'
                      : 'grayscale(1) brightness(0.75)',
                    transition: 'filter 0.3s ease',
                  }}
                />
              </div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
            </div>
          ))}
        </div>

        {/* Column 2: Niyati */}
        <div className="team-column team-column-2">
          {col2.map((member) => (
            <div
              key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <div className="team-card">
                <img
                  src={member.image}
                  alt={member.name}
                  className="team-photo"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    filter: hoveredId === member.id
                      ? 'grayscale(0) brightness(1)'
                      : 'grayscale(1) brightness(0.75)',
                    transition: 'filter 0.3s ease',
                  }}
                />
              </div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
            </div>
          ))}
        </div>

        {/* Column 3: Shreyas & Rahul */}
        <div className="team-column team-column-3">
          {col3.map((member) => (
            <div
              key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <div className="team-card">
                <img
                  src={member.image}
                  alt={member.name}
                  className="team-photo"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    filter: hoveredId === member.id
                      ? 'grayscale(0) brightness(1)'
                      : 'grayscale(1) brightness(0.75)',
                    transition: 'filter 0.3s ease',
                  }}
                />
              </div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
