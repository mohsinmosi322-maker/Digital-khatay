import { sendPasswordResetEmail } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

/** Admin approves reset request and emails Firebase reset link to user */
export async function approvePasswordReset(request, profileEmail, users = []) {
  await updateDoc(doc(db, 'passwordResetRequests', request.id), {
    status: 'approved',
    resolvedAt: serverTimestamp(),
    resolvedBy: profileEmail || '',
  })

  if (!request.email) return { emailSent: false }

  await sendPasswordResetEmail(auth, request.email)

  const match = users.find(
    (u) => (u.email || '').toLowerCase() === String(request.email).toLowerCase()
  )
  if (match?.id) {
    await updateDoc(doc(db, 'users', match.id), {
      canResetPassword: true,
      passwordResetApprovedAt: serverTimestamp(),
    }).catch(() => {})
  }

  return { emailSent: true }
}

export async function rejectPasswordReset(request, profileEmail) {
  await updateDoc(doc(db, 'passwordResetRequests', request.id), {
    status: 'rejected',
    resolvedAt: serverTimestamp(),
    resolvedBy: profileEmail || '',
  })
}
