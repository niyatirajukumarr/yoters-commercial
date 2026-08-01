'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  social?: {
    twitter?: string
    linkedin?: string
    instagram?: string
  }
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'gowtham',
    name: 'BM Gowtham',
    role: 'Chief Executive Officer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/gowtham.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL2dvd3RoYW0uanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjc0OTksImV4cCI6NDkzODkyNzQ5OX0.UjMHHnbbTizHUMHRm22ug1MPzaK4jSQlASVwv8U2mn0',
    social: { linkedin: '#' },
  },
  {
    id: 'niyati',
    name: 'Niyati R',
    role: 'Chief Technical Officer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/niyati.PNG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL25peWF0aS5QTkciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MzI3NTM1LCJleHAiOjQ5Mzg5Mjc1MzV9.7E8rg4hHDXjgdpGSyQ_YTHHU00woTBvKD6U15QZIDGk',
    social: { linkedin: '#' },
  },
  {
    id: 'rahul',
    name: 'Rahul B S',
    role: 'Founding Software Engineer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/rahul%20.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3JhaHVsIC5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTMyNzU1NCwiZXhwIjo0OTM4OTI3NTU0fQ.2SvIBvLBklQdEso8-1eR7PP-dXaAiqzQYdJLJrUz-ms',
    social: { linkedin: '#' },
  },
  {
    id: 'shreyas',
    name: 'Shreyas D J',
    role: 'Head of External Affairs',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/shreyas.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3NocmV5YXMuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjk3OTMsImV4cCI6NDkzODkyOTc5M30.31oQ4a05JhPy4pwDNrvtfZodrAl3Y6dBCscgxhYs9pU',
    social: { linkedin: '#' },
  },
]

interface TeamShowcaseProps {
  members?: TeamMember[]
}

export default function TeamShowcase({ members = DEFAULT_MEMBERS }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Distribute 4 members as: 1 | 1 | 2 for 3-column magazine layout
  const col1 = members.slice(0, 1)
  const col2 = members.slice(1, 2)
  const col3 = members.slice(2, 4)

  return (
    <div style={{ display: 'flex', gap: '48px', maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', alignItems: 'flex-start' }}>
      {/* Photo Grid */}
      <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
        {/* Column 1: 1 photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {col1.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              width={128}
              height={160}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>

        {/* Column 2: 1 photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
          {col2.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              width={160}
              height={224}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>

        {/* Column 3: 2 photos stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {col3.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              width={144}
              height={192}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
      </div>

      {/* Names List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
        {members.map((member) => (
          <MemberRow key={member.id} member={member} hoveredId={hoveredId} onHover={setHoveredId} />
        ))}
      </div>
    </div>
  )
}

function PhotoCard({
  member,
  width,
  height,
  hoveredId,
  onHover,
}: {
  member: TeamMember
  width: number
  height: number
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const isActive = hoveredId === member.id
  const isDimmed = hoveredId !== null && !isActive

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: '12px',
        cursor: 'pointer',
        width: `${width}px`,
        height: `${height}px`,
        opacity: isDimmed ? 0.6 : 1,
        transition: 'opacity 0.4s',
        flexShrink: 0,
      }}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <img
        src={member.image}
        alt={member.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.77)',
          transition: 'filter 0.5s',
        }}
      />
    </div>
  )
}

function MemberRow({
  member,
  hoveredId,
  onHover,
}: {
  member: TeamMember
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const isActive = hoveredId === member.id
  const isDimmed = hoveredId !== null && !isActive

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        cursor: 'pointer',
        opacity: isDimmed ? 0.5 : 1,
        transition: 'all 0.3s',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
      }}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        style={{
          width: isActive ? '4px' : '3px',
          height: isActive ? '4px' : '3px',
          borderRadius: '50%',
          backgroundColor: isActive ? 'white' : 'rgba(255,255,255,0.4)',
          flexShrink: 0,
          marginTop: '4px',
          transition: 'all 0.3s',
        }}
      />
      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
          transition: 'color 0.3s',
          lineHeight: 1.2,
        }}>
          {member.name}
        </div>
        <div style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
          transition: 'color 0.3s',
          lineHeight: 1.2,
          marginTop: '2px',
        }}>
          {member.role}
        </div>
      </div>
    </div>
  )
}
