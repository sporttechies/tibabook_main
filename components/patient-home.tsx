'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock3, HeartPulse, MapPin, Search, ShieldCheck, Sparkles, Stethoscope, Video } from 'lucide-react'
import useSWR from 'swr'
import { Brand } from './brand'

type Hospital = { id: string; name: string; slug: string; city?: string; specialties?: string[]; currency?: string; registrationFeeCents?: number }
type BookingFees = { registrationFeeCents: number; serviceFeeCents: number; currency: string }
type Doctor = { id: string; fullName: string; specialty: string; feeCents?: number }
type Slot = { id: string; startsAt: string; label?: string }

const demoHospitals: Hospital[] = [
  { id: 'demo-1', name: 'Harborview Medical Centre', slug: 'harborview-medical-centre', city: 'Central district', currency: 'USD', specialties: ['General practice', 'Cardiology', 'Pediatrics'], registrationFeeCents: 1000 },
  { id: 'demo-2', name: 'Mwangaza Family Clinic', slug: 'mwangaza-family-clinic', city: 'North district', currency: 'USD', specialties: ['General practice', 'Dermatology', 'Pediatrics'], registrationFeeCents: 0 },
  { id: 'demo-3', name: 'Cedar Specialist Hospital', slug: 'cedar-specialist-hospital', city: 'West district', currency: 'USD', specialties: ['Cardiology', 'Dermatology', 'Orthopedics'], registrationFeeCents: 1500 },
]
const demoDoctors: Record<string, Doctor[]> = {
  'demo-1': [{ id: 'dr-1', fullName: 'Dr. Amina Yusuf', specialty: 'Cardiology' }, { id: 'dr-2', fullName: 'Dr. Joel Kimani', specialty: 'General practice' }, { id: 'dr-3', fullName: 'Dr. Neema Hassan', specialty: 'Pediatrics' }],
  'demo-2': [{ id: 'dr-4', fullName: 'Dr. Daniel Otieno', specialty: 'General practice' }, { id: 'dr-5', fullName: 'Dr. Farida Mollel', specialty: 'Dermatology' }],
  'demo-3': [{ id: 'dr-6', fullName: 'Dr. Lucy Njeri', specialty: 'Cardiology' }, { id: 'dr-7', fullName: 'Dr. Peter Mushi', specialty: 'Orthopedics' }],
}
const demoSlots: Slot[] = [
  { id: 'slot-1', startsAt: '09:00', label: '9:00 AM' }, { id: 'slot-2', startsAt: '10:30', label: '10:30 AM' },
  { id: 'slot-3', startsAt: '13:00', label: '1:00 PM' }, { id: 'slot-4', startsAt: '15:30', label: '3:30 PM' },
]
const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
const fetcher = async (url: string) => {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load live booking data')
  const result = await response.json()
  return result.data ?? result
}
const money = (cents = 0, currency = 'USD') => new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100)

export function BookingWidget({ initialSlug }: { initialSlug?: string }) {
  const [hospitalId, setHospitalId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [slotId, setSlotId] = useState('')
  const [day, setDay] = useState(() => { const date = new Date(); date.setDate(date.getDate() + 2); return date.toISOString().slice(0, 10) })
  const [step, setStep] = useState<'visit' | 'patient' | 'confirmation'>('visit')
  const [message, setMessage] = useState('')
  const [patient, setPatient] = useState({ fullName: '', email: '', phone: '' })
  const today = new Date().toISOString().slice(0, 10)
  const hospitalsKey = apiBase ? `${apiBase}/api/public/hospitals` : null
  const { data: liveHospitals, error: hospitalsError } = useSWR<Hospital[]>(hospitalsKey, fetcher)
  const hospitals = apiBase && liveHospitals ? liveHospitals : demoHospitals
  const activeHospital = hospitals.find((item) => item.id === hospitalId) ?? hospitals.find((item) => item.slug === initialSlug) ?? hospitals[0]
  const doctorsKey = apiBase && activeHospital && !activeHospital.id.startsWith('demo-') ? `${apiBase}/api/public/hospitals/${activeHospital.slug}/doctors` : null
  const { data: liveDoctors } = useSWR<Doctor[]>(doctorsKey, fetcher)
  const doctors = liveDoctors ?? demoDoctors[activeHospital?.id] ?? []
  const activeDoctor = doctors.find((doctor) => doctor.id === doctorId) ?? doctors[0]
  const slotsKey = apiBase && activeHospital?.id && activeDoctor?.id && !activeDoctor.id.startsWith('dr-') ? `${apiBase}/api/public/hospitals/${activeHospital.slug}/slots?doctorId=${encodeURIComponent(activeDoctor.id)}&date=${encodeURIComponent(day)}` : null
  const { data: liveSlots } = useSWR<Slot[]>(slotsKey, fetcher)
  const slots = liveSlots ?? demoSlots
  const selectedSlot = slots.find((slot) => slot.id === slotId)
  const feesKey = apiBase && activeHospital && !activeHospital.id.startsWith('demo-') ? `${apiBase}/api/public/hospitals/${activeHospital.slug}/fees` : null
  const { data: liveFees, error: feesError } = useSWR<BookingFees>(feesKey, fetcher)
  const currency = liveFees?.currency ?? activeHospital?.currency ?? 'USD'
  const registrationFee = liveFees?.registrationFeeCents ?? activeHospital?.registrationFeeCents ?? 0
  const serviceFee = liveFees?.serviceFeeCents ?? (apiBase ? 0 : 250)
  const selectedDate = useMemo(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${day}T12:00:00`)), [day])

  async function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!selectedSlot || !activeDoctor || !activeHospital) {
      setMessage('Choose a hospital, doctor, and appointment time to continue.')
      return
    }
    if (!apiBase || activeHospital.id.startsWith('demo-')) {
      setMessage('Preview only — no appointment has been sent or charged. Connect the API and a payment provider to accept live bookings.')
      return
    }
    try {
      const response = await fetch(`${apiBase}/api/public/appointments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalSlug: activeHospital.slug, doctorId: activeDoctor.id, slotId: selectedSlot.id, appointmentDate: day, patientName: patient.fullName, patientEmail: patient.email, patientPhone: patient.phone }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to submit appointment request')
      setMessage(result.data?.payment?.status === 'not_required' ? `Appointment ${result.data?.appointment?.reference ?? ''} confirmed. No payment is required.` : `Appointment ${result.data?.appointment?.reference ?? ''} received. Checkout is not active yet, so no payment was charged.`)
      setStep('confirmation')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit appointment request.')
    }
  }

  return (
    <section className="booking-card" id="book-appointment" aria-labelledby="booking-title">
      <div className="booking-card-top">
        <div><span className="eyebrow">A better way to book</span><h2 id="booking-title">Find your care</h2></div>
        <span className="secure-note"><ShieldCheck size={15} /> Private &amp; secure</span>
      </div>
      {step === 'confirmation' ? (
        <div className="booking-confirmation" role="status">
          <span className="success-icon"><Check size={21} /></span><h3>Request received</h3><p>{message}</p><button className="text-button" type="button" onClick={() => { setStep('visit'); setMessage(''); setSlotId('') }}>Book another appointment</button>
        </div>
      ) : step === 'visit' ? (
        <div className="booking-fields">
          <label className="field-label" htmlFor="hospital">Hospital or clinic</label>
          <div className="select-wrap"><MapPin size={17} /><select id="hospital" value={activeHospital?.id ?? ''} onChange={(event) => { setHospitalId(event.target.value); setDoctorId(''); setSlotId('') }}>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select><ChevronDown size={16} /></div>
          <div className="field-row">
            <div className="field-group"><label className="field-label" htmlFor="doctor">Specialist</label><div className="select-wrap"><Stethoscope size={17} /><select id="doctor" value={activeDoctor?.id ?? ''} onChange={(event) => { setDoctorId(event.target.value); setSlotId('') }}>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.specialty}</option>)}</select><ChevronDown size={16} /></div></div>
            <div className="field-group"><label className="field-label" htmlFor="visit-date">Visit date</label><div className="select-wrap"><CalendarDays size={17} /><input id="visit-date" type="date" min={today} value={day} onChange={(event) => { setDay(event.target.value); setSlotId('') }} /></div></div>
          </div>
          <div className="slot-heading"><span className="field-label">Available times</span><span>{selectedDate}</span></div>
          <div className="time-options" role="group" aria-label="Available appointment times">{slots.map((slot) => <button key={slot.id} className={`time-option ${slotId === slot.id ? 'selected' : ''}`} type="button" aria-pressed={slotId === slot.id} onClick={() => setSlotId(slot.id)}><Clock3 size={14} /> {slot.label ?? new Date(slot.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</button>)}</div>
          <div className="selected-doctor"><span className="doctor-avatar">{activeDoctor?.fullName.split(' ').slice(1).map((part) => part[0]).join('')}</span><span><strong>{activeDoctor?.fullName}</strong><small>{activeDoctor?.specialty}</small></span><span className="visit-mode"><Video size={14} /> In person</span></div>
          <button className="button-primary button-full" type="button" onClick={() => { if (!slotId) { setMessage('Choose an available appointment time.'); return } setMessage(''); setStep('patient') }}>Continue to patient details <ArrowRight size={17} /></button>
          {hospitalsError && <p className="inline-note">Live clinic list unavailable. Showing sample clinics.</p>}
        </div>
      ) : (
        <form className="booking-fields" onSubmit={confirmBooking}>
          <button className="text-button back-button" type="button" onClick={() => { setStep('visit'); setMessage('') }}>← Back to appointment</button>
          <p className="step-summary">{activeHospital?.name} · {selectedDate} at {selectedSlot?.label ?? selectedSlot?.startsAt}</p>
          <label className="field-label" htmlFor="patient-name">Your full name</label><input className="text-input" id="patient-name" autoComplete="name" required value={patient.fullName} onChange={(event) => setPatient({ ...patient, fullName: event.target.value })} />
          <div className="field-row"><div className="field-group"><label className="field-label" htmlFor="patient-email">Email address</label><input className="text-input" id="patient-email" type="email" autoComplete="email" required value={patient.email} onChange={(event) => setPatient({ ...patient, email: event.target.value })} /></div><div className="field-group"><label className="field-label" htmlFor="patient-phone">Phone number</label><input className="text-input" id="patient-phone" type="tel" autoComplete="tel" required value={patient.phone} onChange={(event) => setPatient({ ...patient, phone: event.target.value })} /></div></div>
          {feesError && <p className="inline-note" role="alert">The hospital&apos;s booking fees are not configured for this currency. Please contact the clinic.</p>}
          <div className="fee-summary"><div><span>Hospital registration</span><strong>{money(registrationFee, currency)}</strong></div><div><span>TibaBook booking service</span><strong>{money(serviceFee, currency)}</strong></div><div className="fee-total"><span>Total shown (no charge today)</span><strong>{money(registrationFee + serviceFee, currency)}</strong></div><small>{apiBase ? 'Live fee schedule · payment provider not connected.' : 'Checkout is disabled. This is a fee estimate; no payment will be taken.'}</small></div>
          {message && <p className="inline-note" role="alert">{message}</p>}
          <button className="button-primary button-full" type="submit" disabled={Boolean(feesError)}>Request appointment <ArrowRight size={17} /></button>
        </form>
      )}
      <div className="booking-card-foot"><span><Check size={14} /> No account needed</span><span>Booking fee shown before you confirm</span></div>
    </section>
  )
}

export default function PatientHome() {
  return (
    <main className="patient-page">
      <header className="site-header"><div className="header-inner"><Brand /><nav className="main-nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#why-tibabook">Why TibaBook</a></nav><a className="hospital-link" href="https://hospital.tibabook.com">For hospitals <ArrowRight size={15} /></a></div></header>
      <section className="hero-section"><div className="hero-inner"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> Care, on your time</span><h1>Good care starts with a <span>simple booking.</span></h1><p>Find a trusted doctor, choose a time that works, and arrive knowing what to expect.</p><div className="hero-proof"><span><span className="proof-icon"><Check size={14} /></span> Verified care providers</span><span><span className="proof-icon"><Check size={14} /></span> Clear fees, upfront</span></div><a className="hero-discovery" href="#book-appointment"><Search size={16} /> Find an appointment <ArrowRight size={15} /></a></div><BookingWidget /></div><div className="hero-footnote"><span>Trusted by growing care teams</span><span className="hero-divider" /><span>Simple scheduling for everyone</span></div></section>
      <section className="value-section" id="why-tibabook"><div className="section-heading"><span className="eyebrow">Care made easier</span><h2>Your health shouldn&apos;t wait on a phone call.</h2><p>Everything you need to get from search to appointment, in one calm, clear experience.</p></div><div className="value-grid"><article className="value-card"><span className="value-icon blue"><Search size={19} /></span><h3>Find the right care</h3><p>Browse clinics and specialists by location, service, and availability.</p></article><article className="value-card"><span className="value-icon green"><CalendarDays size={19} /></span><h3>Choose your time</h3><p>See appointment times that work for you and book in a few steps.</p></article><article className="value-card"><span className="value-icon slate"><HeartPulse size={19} /></span><h3>Know what to expect</h3><p>Get clear fee details before confirming your appointment request.</p></article></div></section>
      <section className="steps-section" id="how-it-works"><div className="steps-copy"><span className="eyebrow">Your next visit, in three steps</span><h2>Less admin. More time for you.</h2></div><div className="steps-list"><div><b>01</b><span><strong>Choose a clinic</strong><small>Find a provider that fits your needs.</small></span></div><div><b>02</b><span><strong>Pick a time</strong><small>Book directly from the provider&apos;s schedule.</small></span></div><div><b>03</b><span><strong>Confirm your visit</strong><small>Review the fees and appointment details.</small></span></div></div></section>
      <footer className="site-footer"><Brand compact /><p>Better access to care, one appointment at a time.</p><span>© 2026 TibaBook. For emergencies, contact your local emergency service.</span></footer>
    </main>
  )
}
