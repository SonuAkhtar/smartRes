import type { UserProfile, TailoredResume } from '../../types'
import './ResumeDocument.css'

interface Props {
  profile: UserProfile
  tailored?: TailoredResume | null
}

export default function ResumeDocument({ profile, tailored }: Props) {
  const highlightedSkills = new Set(tailored?.matchedSkills.map(s => s.toLowerCase()) ?? [])
  const suggestedSkills = tailored?.suggestedSkills ?? []
  const summary = tailored?.tailoredSummary ?? profile.summary

  return (
    <div className="resume-document" id="resume-preview">
      {/* Header */}
      <div className="resume-document_header">
        <h1 className="resume-document_name">{profile.name}</h1>
        <div className="resume-document_job-headline">{profile.title}</div>
        <div className="resume-document_contact">
          {profile.email && (
            <span className="resume-document_contact-item">
              <span className="resume-document_contact-icon">✉</span>
              {profile.email}
            </span>
          )}
          {profile.phone && (
            <span className="resume-document_contact-item">
              <span className="resume-document_contact-icon">📞</span>
              {profile.phone}
            </span>
          )}
          {profile.location && (
            <span className="resume-document_contact-item">
              <span className="resume-document_contact-icon">📍</span>
              {profile.location}
            </span>
          )}
          {profile.linkedIn && (
            <span className="resume-document_contact-item">
              <span className="resume-document_contact-icon">in</span>
              {profile.linkedIn.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          )}
          {profile.portfolio && (
            <span className="resume-document_contact-item">
              <span className="resume-document_contact-icon">🌐</span>
              {profile.portfolio.replace(/^https?:\/\/(www\.)?/, '')}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <section className="resume-document_section">
          <h2 className="resume-document_section-title">Professional Summary</h2>
          <div className="resume-document_divider" />
          <p className="resume-document_summary">{summary}</p>
        </section>
      )}

      {/* Skills */}
      {(profile.skills.length > 0 || suggestedSkills.length > 0) && (
        <section className="resume-document_section">
          <h2 className="resume-document_section-title">Skills</h2>
          <div className="resume-document_divider" />
          <div className="resume-document_skills-list">
            {profile.skills.map(skill => (
              <span
                key={skill}
                className={`resume-document_skill-tag ${highlightedSkills.has(skill.toLowerCase()) ? 'resume-document_skill-tag-highlighted' : ''}`}
              >
                {skill}
              </span>
            ))}
            {suggestedSkills.map(skill => (
              <span key={skill} className="resume-document_skill-tag resume-document_skill-tag-suggested">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {profile.experiences?.length > 0 && (
        <section className="resume-document_section">
          <h2 className="resume-document_section-title">Experience</h2>
          <div className="resume-document_divider" />
          {profile.experiences.map(exp => (
            <div key={exp.id} className="resume-document_experience">
              <div className="resume-document_experience-header">
                <div>
                  <div className="resume-document_position">{exp.title || profile.title}</div>
                  <div className="resume-document_company">{exp.company}</div>
                </div>
                {exp.duration && (
                  <div className="resume-document_duration">{exp.duration}</div>
                )}
              </div>
              {exp.description && (
                <p className="resume-document_job-description">{exp.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {profile.educations?.length > 0 && (
        <section className="resume-document_section">
          <h2 className="resume-document_section-title">Education</h2>
          <div className="resume-document_divider" />
          {profile.educations.map(edu => (
            <div key={edu.id} className="resume-document_education-item">
              <div>
                <div className="resume-document_degree">{edu.degree}</div>
                <div className="resume-document_school">{edu.school}</div>
              </div>
              {edu.year && (
                <div className="resume-document_year">{edu.year}</div>
              )}
            </div>
          ))}
        </section>
      )}

    </div>
  )
}
