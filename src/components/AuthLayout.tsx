import React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      {children}
    </div>
  )
}

export default AuthLayout
