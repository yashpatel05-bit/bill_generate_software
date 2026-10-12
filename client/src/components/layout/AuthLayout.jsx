import React from 'react'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 selection:bg-[#758C76] selection:text-white">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
