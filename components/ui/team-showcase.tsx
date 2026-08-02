'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface TeamMember {
  id: string
  name: string
  role: string
  image: string
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'gowtham',
    name: 'BM Gowtham',
    role: 'Chief Executive Officer',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/gowtham.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL2dvd3RoYW0uanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjc0OTksImV4cCI6NDkzODkyNzQ5OX0.UjMHHnbbTizHUMHRm22ug1MPzaK4jSQlASVwv8U2mn0',
  },
  {
    id: 'niyati',
    name: 'Niyati R',
    role: 'Chief Technical Officer',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/niyati.PNG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL25peWF0aS5QTkciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MzI3NTM1LCJleHAiOjQ5Mzg5Mjc1MzV9.7E8rg4hHDXjgdpGSyQ_YTHHU00woTBvKD6U15QZIDGk',
  },
  {
    id: 'shreyas',
    name: 'Shreyas D J',
    role: 'Head of External Affairs',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/shreyas.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3NocmV5YXMuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjk3OTMsImV4cCI6NDkzODkyOTc5M30.31oQ4a05JhPy4pwDNrvtfZodrAl3Y6dBCscgxhYs9pU',
  },
  {
    id: 'rahul',
    name: 'Rahul B S',
    role: 'Founding Software Engineer',
    image: 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/rahul%20.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3JhaHVsIC5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTMyNzU1NCwiZXhwIjo0OTM4OTI3NTU0fQ.2SvIBvLBklQdEso8-1eR7PP-dXaAiqzQYdJLJrUz-ms',
  },
]

interface TeamShowcaseProps {
  members?: TeamMember[]
}

export default function TeamShowcase({ members = DEFAULT_MEMBERS }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {members.map((member) => (
          <div
            key={member.id}
            onMouseEnter={() => setHoveredId(member.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="cursor-pointer"
          >
            <div
              className={cn(
                'overflow-hidden rounded-lg aspect-[3/4] transition-all duration-300',
                hoveredId === member.id ? 'ring-2 ring-red-500' : ''
              )}
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover transition-[filter] duration-500"
                style={{
                  filter: hoveredId === member.id
                    ? 'grayscale(0) brightness(1)'
                    : 'grayscale(1) brightness(0.75)',
                }}
              />
            </div>
            {/* Name and Role */}
            <div className={cn(
              'mt-3 transition-opacity duration-300',
              hoveredId && hoveredId !== member.id ? 'opacity-50' : 'opacity-100'
            )}>
              <h3 className="text-sm md:text-base font-semibold text-gray-900">{member.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
