import { artworkSubject } from './publicContent'

export function ProgramGraphic({ title, identity }: { title: string; identity: string }) {
  const subject = artworkSubject(title)
  const variant = Array.from(identity).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 3
  return <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-art-subject={subject} data-variant={variant}>
    {subject === 'web' && <g transform={`translate(${variant * 12},0)`}><rect x="175" y="20" width="210" height="185" rx="5"/><path d="M175 55h210M195 38h4m8 0h4m8 0h4M205 82h150M205 100h65M205 118h90M230 145l-18 16 18 16m85-32 18 16-18 16m-35-40-16 60"/></g>}
    {subject === 'python' && <g transform={`rotate(${variant * 8 - 8},285,125)`}><path d="M250 15h100v95h-70v55h-70v70H110v-95h70V85h70z"/><path d="M205 30h100v65h-70v55h-70v70"/><circle cx="277" cy="42" r="5"/><circle cx="153" cy="206" r="5"/></g>}
    {subject === 'design' && <g transform={`rotate(${variant * 6 - 6},280,120)`}><circle cx="305" cy="85" r="75"/><rect x="192" y="78" width="130" height="130" rx="2"/><path d="M135 170 220 25l85 145zM192 143h130M257 78v130"/></g>}
    {subject === 'data' && <g><path d="M155 200h235M175 200V115h32v85m25 0V65h32v135m25 0V25h32v175M155 80l70 25 65-60 70 25"/><circle cx="155" cy="80" r="5"/><circle cx="225" cy="105" r="5"/><circle cx="290" cy="45" r="5"/><circle cx="360" cy="70" r="5"/></g>}
    {subject === 'knowledge' && <g><path d="m245 20 100 100-100 100-100-100ZM245 65l55 55-55 55-55-55ZM145 120v120M185 180v60M0 210h125M345 120h55"/></g>}
  </svg>
}
