'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// Adapted from https://21st.dev/@makviesainte/components/team-showcase
//
// Three deviations from the original, all forced by this codebase:
//
// 1. react-icons is not a dependency here, so the social glyphs are inline
//    SVGs in this file. Behance is dropped — it was in the demo data and has
//    no use for this team.
// 2. globals.css has an unlayered `* { margin: 0; padding: 0 }`. Tailwind 4
//    emits utilities inside @layer, and unlayered CSS beats layered CSS
//    whatever the specificity, so every m-* and p-* class in this app is a
//    no-op. The spacing that actually carries the layout — the staggered
//    column offsets above all — is therefore in the .ts-* rules below, which
//    are class-level and so outrank the `*` reset. Sizes, colours, flex, gap,
//    rounding and transitions are unaffected and stay as Tailwind.
// 3. Column placement is explicit rather than `i % 3`. The modulo split is
//    built for six members; with four it would put Gowtham above Shreyas.

export interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  /** Photo column, left to right. Set per member so four people can be placed. */
  column: 1 | 2 | 3
  social?: {
    twitter?: string
    linkedin?: string
    instagram?: string
  }
}

// Social links to follow — LinkedIn URLs go in the `social` object per member
// and the icons appear on hover automatically.
const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'gowtham',
    name: 'BM Gowtham',
    role: 'Chief Executive Officer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/gowtham.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL2dvd3RoYW0uanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjc0OTksImV4cCI6NDkzODkyNzQ5OX0.UjMHHnbbTizHUMHRm22ug1MPzaK4jSQlASVwv8U2mn0',
    column: 3,
  },
  {
    id: 'niyati',
    name: 'Niyati R',
    role: 'Chief Technical Officer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/niyati.PNG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL25peWF0aS5QTkciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg1MzI3NTM1LCJleHAiOjQ5Mzg5Mjc1MzV9.7E8rg4hHDXjgdpGSyQ_YTHHU00woTBvKD6U15QZIDGk',
    column: 3,
  },
  {
    id: 'rahul',
    name: 'Rahul B S',
    role: 'Founding Software Engineer',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/rahul%20.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3JhaHVsIC5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NTMyNzU1NCwiZXhwIjo0OTM4OTI3NTU0fQ.2SvIBvLBklQdEso8-1eR7PP-dXaAiqzQYdJLJrUz-ms',
    column: 2,
  },
  {
    id: 'shreyas',
    name: 'Shreyas D J',
    role: 'Head of External Affairs',
    image:
      'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/sign/Meet%20the%20team/shreyas.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xNTM3ZjNkYy05M2E3LTQzMmItOWQ4Yy02YmI1MmNlMGY0YzgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJNZWV0IHRoZSB0ZWFtL3NocmV5YXMuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODUzMjc1NzAsImV4cCI6NDkzODkyNzU3MH0.0-NRvVjEBROS0tMFpKOVtMdky42X0q1JrrQhSGbtBZc',
    column: 1,
  },
]

interface TeamShowcaseProps {
  members?: TeamMember[]
}

export default function TeamShowcase({ members = DEFAULT_MEMBERS }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const col1 = members.filter(m => m.column === 1)
  const col2 = members.filter(m => m.column === 2)
  const col3 = members.filter(m => m.column === 3)

  return (
    <>
      <style>{`
        .ts-root { padding: 32px 0; }
        .ts-photos { padding-bottom: 4px; }
        /* The stagger. Column 1 sits flush, the other two hang lower. */
        .ts-col2 { margin-top: 48px; }
        .ts-col3 { margin-top: 22px; }
        .ts-list { padding-top: 0; }
        .ts-role { margin-top: 6px; padding-left: 27px; }
        .ts-social a { padding: 4px; }

        @media (min-width: 640px) {
          .ts-col2 { margin-top: 56px; }
          .ts-col3 { margin-top: 26px; }
        }
        @media (min-width: 768px) {
          .ts-col2 { margin-top: 68px; }
          .ts-col3 { margin-top: 32px; }
          .ts-list { padding-top: 8px; }
        }
      `}</style>

      <div className="ts-root flex flex-col md:flex-row items-start gap-8 md:gap-10 lg:gap-14 select-none w-full font-sans">
        {/* Photo grid */}
        <div className="ts-photos flex gap-2 md:gap-3 flex-shrink-0 overflow-x-auto">
          <div className="flex flex-col gap-2 md:gap-3">
            {col1.map(member => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[110px] h-[120px] sm:w-[130px] sm:h-[140px] md:w-[155px] md:h-[165px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          <div className="ts-col2 flex flex-col gap-2 md:gap-3">
            {col2.map(member => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[122px] h-[132px] sm:w-[145px] sm:h-[155px] md:w-[172px] md:h-[182px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          <div className="ts-col3 flex flex-col gap-2 md:gap-3">
            {col3.map(member => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[115px] h-[125px] sm:w-[136px] sm:h-[146px] md:w-[162px] md:h-[172px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>
        </div>

        {/* Name list */}
        <div className="ts-list flex flex-col sm:grid sm:grid-cols-2 md:flex md:flex-col gap-4 md:gap-5 flex-1 w-full">
          {members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function PhotoCard({
  member,
  className,
  hoveredId,
  onHover,
}: {
  member: TeamMember
  className: string
  hoveredId: string | null
  onHover: (id: string | null) => void
}) {
  const isActive = hoveredId === member.id
  const isDimmed = hoveredId !== null && !isActive

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl cursor-pointer flex-shrink-0 transition-opacity duration-500',
        className,
        isDimmed ? 'opacity-60' : 'opacity-100'
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(isActive ? null : member.id)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-full object-cover transition-[filter] duration-500"
        style={{
          filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.77)',
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
  const social = member.social
  const hasSocial = Boolean(social?.twitter || social?.linkedin || social?.instagram)

  return (
    <div
      className={cn('cursor-pointer transition-opacity duration-300', isDimmed ? 'opacity-50' : 'opacity-100')}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'h-3 rounded-[5px] flex-shrink-0 transition-all duration-300',
            isActive ? 'bg-foreground w-5' : 'bg-foreground/25 w-4'
          )}
        />
        <span
          className={cn(
            'text-base md:text-[18px] font-semibold leading-none tracking-tight transition-colors duration-300',
            isActive ? 'text-foreground' : 'text-foreground/80'
          )}
        >
          {member.name}
        </span>

        {hasSocial && (
          <div
            className={cn(
              'ts-social flex items-center gap-1.5 transition-all duration-200',
              isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
            )}
          >
            {social?.twitter && (
              <SocialLink href={social.twitter} title="X / Twitter">
                <XIcon />
              </SocialLink>
            )}
            {social?.linkedin && (
              <SocialLink href={social.linkedin} title="LinkedIn">
                <LinkedInIcon />
              </SocialLink>
            )}
            {social?.instagram && (
              <SocialLink href={social.instagram} title="Instagram">
                <InstagramIcon />
              </SocialLink>
            )}
          </div>
        )}
      </div>

      <p className="ts-role text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {member.role}
      </p>
    </div>
  )
}

function SocialLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all duration-150 hover:scale-110"
      title={title}
    >
      {children}
    </a>
  )
}

/* Inline glyphs, since react-icons is not a dependency here. */

function LinkedInIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
