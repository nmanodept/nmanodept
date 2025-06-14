//Location: /src/components/forms/LoginForm/index.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../../common/Button'
import './LoginForm.css'

const LoginForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="login-form">
      <div className="form-group">
        <label htmlFor="username">用戶名稱 / Email</label>
        <input
          id="username"
          type="text"
          {...register('username', { required: '請 輸 入 用 戶 名 稱 或 Email' })}
          className={errors.username ? 'error' : ''}
          placeholder="輸入您的用戶名稱或 Email"
          autoComplete="username"
        />
        {errors.username && <span className="error-message">{errors.username.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">密碼</label>
        <input
          id="password"
          type="password"
          {...register('password', { required: '請輸入密碼' })}
          className={errors.password ? 'error' : ''}
          placeholder="輸入您的密碼"
          autoComplete="current-password"
        />
        {errors.password && <span className="error-message">{errors.password.message}</span>}
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? '登入中...' : '登入'}
      </Button>
    </form>
  )
}

export default LoginForm