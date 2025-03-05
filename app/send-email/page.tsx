'use client'

import { useState, FormEvent } from 'react'

// ... existing interface ...

export default function SendEmailPage() {
  // Individual state for each field
  const [subject, setSubject] = useState('')
  const [sender, setSender] = useState('')
  const [recipients, setRecipients] = useState([''])
  const [cc, setCc] = useState([''])
  const [bcc, setBcc] = useState([''])
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('Form submission started')

    // Validate emails before sending
    const allEmails = [...recipients, ...cc, ...bcc]
    console.log('All emails:', allEmails)

    for (const email of allEmails) {
      if (email && !isValidEmail(email)) {
        console.error('Invalid email detected:', email)
        alert('Please enter valid email addresses.')
        setIsLoading(false)
        return
      }
    }

    // Filter out empty strings
    const filteredRecipients = recipients.filter(email => email.trim() !== '')
    const filteredCc = cc.filter(email => email.trim() !== '')
    const filteredBcc = bcc.filter(email => email.trim() !== '')

    console.log('Filtered Recipients:', filteredRecipients)
    console.log('Filtered CC:', filteredCc)
    console.log('Filtered BCC:', filteredBcc)

    try {
      const formData = {
        subject,
        sender,
        recipient: filteredRecipients,
        cc: filteredCc,
        bcc: filteredBcc,
        body
      }

      console.log('Form data to be sent:', formData)

      const response = await fetch('/api/store-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to store email')
      }

      console.log('Email stored successfully')

      // Reset form after successful submission
      setSubject('')
      setSender('')
      setRecipients([''])
      setCc([''])
      setBcc([''])
      setBody('')

      alert('Email stored successfully!')
    } catch (error) {
      console.error('Error storing email:', error)
      alert('Failed to store email')
    } finally {
      setIsLoading(false)
      console.log('Form submission ended')
    }
  }

  // Helper function to handle array fields (recipient, cc, bcc)
  const handleArrayFieldChange = (
    field: 'recipient' | 'cc' | 'bcc',
    index: number,
    value: string
  ) => {
    switch (field) {
      case 'recipient':
        const newRecipients = [...recipients]
        newRecipients[index] = value
        setRecipients(newRecipients)
        break
      case 'cc':
        const newCc = [...cc]
        newCc[index] = value
        setCc(newCc)
        break
      case 'bcc':
        const newBcc = [...bcc]
        newBcc[index] = value
        setBcc(newBcc)
        break
    }
  }

  // Helper function to add new empty field to arrays
  const addNewField = (field: 'recipient' | 'cc' | 'bcc') => {
    switch (field) {
      case 'recipient':
        setRecipients([...recipients, ''])
        break
      case 'cc':
        setCc([...cc, ''])
        break
      case 'bcc':
        setBcc([...bcc, ''])
        break
    }
  }

  return (
    <div className="mx-auto p-6 w-full">
      <h1 className="text-2xl font-bold mb-6">Send Email</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Sender */}
        <div>
          <label htmlFor="sender" className="block text-sm font-medium mb-2">
            Sender
          </label>
          <input
            type="email"
            id="sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium mb-2">Recipients</label>
          {recipients.map((email, index) => (
            <div key={index} className="mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleArrayFieldChange('recipient', index, e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addNewField('recipient')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add recipient
          </button>
        </div>

        {/* CC */}
        <div>
          <label className="block text-sm font-medium mb-2">CC</label>
          {cc.map((email, index) => (
            <div key={index} className="mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleArrayFieldChange('cc', index, e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addNewField('cc')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add CC
          </button>
        </div>

        {/* BCC */}
        <div>
          <label className="block text-sm font-medium mb-2">BCC</label>
          {bcc.map((email, index) => (
            <div key={index} className="mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleArrayFieldChange('bcc', index, e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => addNewField('bcc')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add BCC
          </button>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-2">
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Storing...
            </>
          ) : (
            'Store Email'
          )}
        </button>
      </form>
    </div>
  )
}
