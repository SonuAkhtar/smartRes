import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../../components/Spinner/Spinner'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { useAuth } from '../../context/AuthContext'
import { useResume } from '../../context/ResumeContext'
import { useToast } from '../../context/ToastContext'
import { removeJobEntry, saveApplication } from '../../lib/db'
import { EASE_SPRING, DURATION } from '../../lib/motion'
import type { JobEntry, TailoredResume, UserProfile, JobApplication } from '../../types'
import './JobHistory.css'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function ScoreRing({ score }: { score: number }) {
  const radius = 26
  const stroke = 5
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference
  const color = score >= 80 ? '#116466' : score >= 60 ? '#ffcb9a' : '#d9b0bc'

  return (
    <div className="jh-score-ring">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <motion.circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE_SPRING }}
          style={{ transformOrigin: '32px 32px', transform: 'rotate(-90deg)' }}
        />
      </svg>
      <div className="jh-score-value" style={{ color }}>
        {score}<span className="jh-score-pct">%</span>
      </div>
    </div>
  )
}

async function downloadEntryDOCX(entry: JobEntry, profile: UserProfile) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: profile.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: profile.title, bold: true, color: '116466' })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun(`${profile.email}  |  ${profile.phone}  |  ${profile.location}`)],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),

        ...(entry.tailoredSummary ? [
          new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: entry.tailoredSummary }),
          new Paragraph({ text: '' }),
        ] : []),

        ...(profile.skills.length > 0 || entry.suggestedSkills.length > 0 ? [
          new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun(profile.skills.join('  •  ')),
              ...(entry.suggestedSkills.length > 0 ? [
                new TextRun({ text: `  •  ${entry.suggestedSkills.join('  •  ')} (suggested)`, italics: true }),
              ] : []),
            ],
          }),
          new Paragraph({ text: '' }),
        ] : []),

        ...(profile.experiences?.length > 0 ? [
          new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_2 }),
          ...profile.experiences.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.title || profile.title, bold: true }),
                new TextRun(`  -  ${exp.company}`),
                ...(exp.duration ? [new TextRun(`  (${exp.duration})`)] : []),
              ],
            }),
            ...(exp.description ? [new Paragraph({ text: exp.description })] : []),
          ]),
          new Paragraph({ text: '' }),
        ] : []),

        ...(profile.educations?.length > 0 ? [
          new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }),
          ...profile.educations.map(edu =>
            new Paragraph({
              children: [
                new TextRun({ text: edu.degree, bold: true }),
                new TextRun(`  -  ${edu.school}`),
                ...(edu.year ? [new TextRun(`  (${edu.year})`)] : []),
              ],
            })
          ),
          new Paragraph({ text: '' }),
        ] : []),

        new Paragraph({
          children: [new TextRun({ text: `Job Match Score: ${entry.matchScore}%  |  ${entry.company || 'Unknown Company'}`, italics: true, color: '666666' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${profile.name || 'resume'}_${entry.company || 'job'}_tailored.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function EntryCard({
  entry,
  index,
  profile,
  onDelete,
  onLoadInDashboard,
  onTrack,
}: {
  entry: JobEntry
  index: number
  profile: UserProfile | null
  onDelete: () => void
  onLoadInDashboard: () => void
  onTrack: () => void
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [downloadingDocx, setDownloadingDocx] = useState(false)

  const scoreLabel = entry.matchScore >= 80 ? 'Strong Match' : entry.matchScore >= 60 ? 'Good Match' : 'Needs Work'
  const scoreCls   = entry.matchScore >= 80 ? 'high' : entry.matchScore >= 60 ? 'mid' : 'low'

  const handleDownloadDocx = async () => {
    if (!profile) return
    setDownloadingDocx(true)
    try {
      await downloadEntryDOCX(entry, profile)
    } finally {
      setDownloadingDocx(false)
    }
  }

  return (
    <motion.div
      className="jh-card"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE_SPRING }}
      layout
    >
      {/* Top accent bar */}
      <div className={`jh-card-accent jh-card-accent-${scoreCls}`} />

      <div className="jh-card-body">
        {/* Main row */}
        <div className="jh-card-main">
          <ScoreRing score={entry.matchScore} />

          <div className="jh-card-info">
            <div className="jh-card-top-row">
              <div>
                <h3 className="jh-card-company">
                  {entry.company || <span className="jh-no-company">No company specified</span>}
                </h3>
                <div className="jh-card-meta">
                  <Badge variant={scoreCls === 'high' ? 'success' : scoreCls === 'mid' ? 'warning' : 'error'}>{scoreLabel}</Badge>
                  <span className="jh-meta-dot">·</span>
                  <span className="jh-card-date">{formatDate(entry.createdAt)}</span>
                </div>
              </div>
              <div className="jh-card-stats">
                <div className="jh-stat">
                  <span className="jh-stat-value">{entry.matchedSkills.length}</span>
                  <span className="jh-stat-label">matched</span>
                </div>
                <div className="jh-stat">
                  <span className="jh-stat-value">{entry.suggestedSkills.length}</span>
                  <span className="jh-stat-label">to add</span>
                </div>
              </div>
            </div>

            {/* Snippet */}
            <p className="jh-card-snippet">{entry.jdSnippet}…</p>

            {/* Skills preview */}
            {(entry.matchedSkills.length > 0 || entry.suggestedSkills.length > 0) && (
              <div className="jh-skills-row">
                {entry.matchedSkills.slice(0, 4).map(s => (
                  <span key={s} className="jh-skill-tag jh-skill-matched">{s}</span>
                ))}
                {entry.suggestedSkills.slice(0, 2).map(s => (
                  <span key={s} className="jh-skill-tag jh-skill-suggested">{s}</span>
                ))}
                {(entry.matchedSkills.length + entry.suggestedSkills.length) > 6 && (
                  <span className="jh-skills-more">
                    +{entry.matchedSkills.length + entry.suggestedSkills.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded section */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="jh-expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { duration: 0.32, ease: EASE_SPRING } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
            >
              <div className="jh-expanded-inner">
                {entry.suggestions.length > 0 && (
                  <div className="jh-section">
                    <div className="jh-section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Resume Suggestions
                    </div>
                    <div className="jh-suggestions">
                      {entry.suggestions.map((s, i) => (
                        <div key={i} className={`jh-suggestion jh-suggestion-${s.priority}`}>
                          <div className="jh-suggestion-header">
                            <span className="jh-suggestion-section">{s.section}</span>
                            <Badge variant={s.priority === 'high' ? 'success' : s.priority === 'medium' ? 'warning' : 'muted'}>{s.priority}</Badge>
                          </div>
                          <p className="jh-suggestion-text">{s.suggestion}</p>
                          {s.keywords.length > 0 && (
                            <div className="jh-kw-tags">
                              {s.keywords.map(k => <span key={k} className="jh-kw-tag">{k}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.suggestedSkills.length > 0 && (
                  <div className="jh-section">
                    <div className="jh-section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Skills to Add
                    </div>
                    <div className="jh-skills-row">
                      {entry.suggestedSkills.map(s => (
                        <span key={s} className="jh-skill-tag jh-skill-suggested">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.tailoredSummary && (
                  <div className="jh-section">
                    <div className="jh-section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Tailored Summary
                    </div>
                    <p className="jh-tailored">{entry.tailoredSummary}</p>
                  </div>
                )}

                <div className="jh-section">
                  <div className="jh-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Full Job Description
                  </div>
                  <div className="jh-jd-text">{entry.fullJD}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download / use actions */}
        <div className="jh-resume-actions">
          {profile && (
            <>
              <button
                className="jh-use-btn"
                onClick={onLoadInDashboard}
                title="Load this tailored resume into the Dashboard"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                View Resume
              </button>
              <button
                className="jh-download-docx-btn"
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                title="Download tailored resume as Word document"
              >
                {downloadingDocx ? (
                  <Spinner size="xs" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                DOCX
              </button>
            </>
          )}
          <button
            className="jh-track-btn"
            onClick={onTrack}
            title="Track this application"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Track
          </button>
          <button
            className="jh-interview-btn"
            onClick={() => navigate(`/interview-prep?entryId=${entry.id}`)}
            title="Generate interview questions for this job"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Interview Prep
          </button>
        </div>

        {/* Actions bar */}
        <div className="jh-card-actions">
          <button className="jh-toggle-btn" onClick={() => setExpanded(v => !v)}>
            <motion.svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}
              style={{ width: 14, height: 14 }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </motion.svg>
            {expanded ? 'Hide Details' : 'View Details'}
          </button>

          {confirmDelete ? (
            <div className="jh-delete-confirm">
              <span>Remove this entry?</span>
              <button className="jh-confirm-yes" onClick={onDelete}>Yes, delete</button>
              <button className="jh-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button className="jh-delete-btn" onClick={() => setConfirmDelete(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function JobHistory() {
  const { user } = useAuth()
  const { profile, jobHistory, deleteJobEntry, addJobEntry, setTailoredResume, addApplication } = useResume()
  const navigate = useNavigate()
  const { info } = useToast()
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const handleDelete = (id: string) => {
    const deleted = jobHistory.find(e => e.id === id)
    if (!deleted) return
    deleteJobEntry(id)
    const timer = setTimeout(() => {
      if (user) removeJobEntry(id)
      deleteTimers.current.delete(id)
    }, 4000)
    deleteTimers.current.set(id, timer)
    info('Analysis deleted', {
      undoLabel: 'Undo',
      onUndo: () => {
        clearTimeout(deleteTimers.current.get(id))
        deleteTimers.current.delete(id)
        addJobEntry(deleted)
      },
    })
  }

  const handleLoadInDashboard = (entry: JobEntry) => {
    if (!profile) return
    const tailored: TailoredResume = {
      ...profile,
      matchedSkills: entry.matchedSkills,
      suggestedSkills: entry.suggestedSkills,
      tailoredSummary: entry.tailoredSummary,
      matchScore: entry.matchScore,
      suggestions: entry.suggestions,
      company: entry.company,
      analyzedAt: entry.createdAt,
    }
    setTailoredResume(tailored)
    navigate('/dashboard')
  }

  const handleTrack = (entry: JobEntry) => {
    const now = new Date().toISOString()
    const app: JobApplication = {
      id: `app_${entry.id}`,
      jobEntryId: entry.id,
      company: entry.company,
      role: profile?.title ?? '',
      jdSnippet: entry.jdSnippet,
      matchScore: entry.matchScore,
      status: 'saved',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }
    addApplication(app)
    if (user) saveApplication(user.id, app)
    navigate('/applications')
  }

  return (
    <div className="job-history">
      <div className="job-history_container">

        <motion.div className="job-history_header"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div>
            <h1 className="job-history_title">Match History</h1>
            <p className="job-history_subtitle">
              {jobHistory.length > 0
                ? `${jobHistory.length} previous ${jobHistory.length === 1 ? 'analysis' : 'analyses'}`
                : 'No analyses yet'}
            </p>
          </div>
          <button className="job-history_new-btn" onClick={() => navigate('/job-matcher')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 14, height: 14 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Analyze New Job
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {jobHistory.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <EmptyState
                className="job-history_empty"
                icon={
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <circle cx="32" cy="32" r="28" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 4"/>
                    <path d="M22 32h20M32 22v20" stroke="var(--color-border-dark)" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                }
                title={profile ? "No analyses yet" : "Profile not set up"}
                description={
                  profile
                    ? "Paste your first job description to see your resume alignment and get personalised suggestions."
                    : "Build your profile first, then match to jobs to see your history here."
                }
                cta={
                  profile
                    ? { label: 'Analyze Your First Job →', onClick: () => navigate('/job-matcher'), className: 'job-history_new-btn job-history_new-btn-lg' }
                    : { label: 'Build Profile →', onClick: () => navigate('/profile-builder'), className: 'job-history_new-btn job-history_new-btn-lg' }
                }
              />
            </motion.div>
          ) : (
            <motion.div key="list" className="job-history_list">
              <AnimatePresence>
                {jobHistory.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    profile={profile}
                    onDelete={() => handleDelete(entry.id)}
                    onLoadInDashboard={() => handleLoadInDashboard(entry)}
                    onTrack={() => handleTrack(entry)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
