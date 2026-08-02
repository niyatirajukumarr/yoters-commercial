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
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/gowtham.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL2dvd3RoYW0uanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjc0OTksImV4cCI6NDkzODkyNzQ5OX0.UjMHHnbbTizHUMHRm22ug1MPzaK4jSQlASVwv8U2mn0',
    column: 1,
    row: 1,
  },
  {
    id: 'niyati',
    name: 'Niyati R',
    role: 'Chief Technical Officer',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/niyati.PNG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL25peWF0aS5QTkciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MzI3NTM1LCJleHAiOjQ5Mzg5Mjc1MzV9.7E8rg4hHDXjgdpGSyQ_YTHHU00woTBvKD6U15QZIDGk',
    column: 2,
    row: 1,
  },
  {
    id: 'shreyas',
    name: 'Shreyas D J',
    role: 'Head of External Affairs',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/shreyas.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3NocmV5YXMuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjk3OTMsImV4cCI6NDkzODkyOTc5M30.31oQ4a05JhPy4pwDNrvtfZodrAl3Y6dBCscgxhYs9pU',
    column: 3,
    row: 1,
  },
  {
    id: 'rahul',
    name: 'Rahul B S',
    role: 'Founding Software Engineer',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/rahul%20.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3JhaHVsIC5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTMyNzU1NCwiZXhwIjo0OTM4OTI3NTU0fQ.2SvIBvLBklQdEso8-1eR7PP-dXaAiqzQYdJLJrUz-ms',
    column: 3,
    row: 2,
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
        .team-container { display: flex; gap: 24px; width: 100%; margin: 0 auto; padding: 32px 16px; flex-wrap: wrap; }
        @media (min-width: 769px) {
          .team-container { max-width: none; padding: 48px 64px; }
        }
        .team-column { display: flex; flex-direction: column; gap: 24px; }
        .team-column-1 { flex: 0 0 auto; width: 150px; }
        .team-column-2 { flex: 0 0 auto; width: 150px; margin-top: 145px; }
        .team-column-3 { flex: 0 0 auto; width: 150px; margin-top: 30px; }
        @media (max-width: 768px) {
          .team-container { gap: 16px; padding: 24px 12px; }
          .team-column { gap: 16px; }
          .team-column-1 { width: 90px; }
          .team-column-2 { width: 90px; margin-top: 85px !important; }
          .team-column-3 { width: 90px; margin-top: 20px !important; }
          .team-name { font-size: 12px; }
          .team-role { font-size: 10px; }
        }
        .team-card { width: 100% !important; max-width: 200px; aspect-ratio: 3/4; }
        .team-photo { width: 100% !important; height: 100% !important; object-fit: cover; border-radius: 8px; }
        .team-name { font-size: 14px; font-weight: 600; margin-top: 12px; color: #1a1a1a; }
        .team-role { font-size: 12px; color: #666; margin-top: 4px; }
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
