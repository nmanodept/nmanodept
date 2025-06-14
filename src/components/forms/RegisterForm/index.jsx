//Location: /src/components/forms/RegisterForm/index.jsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../../common/Button'
import './RegisterForm.css'

const RegisterForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [availableAuthors, setAvailableAuthors] = useState([])
  const [showAuthorSelect, setShowAuthorSelect] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const password = watch('password')

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/authors`)
      if (response.ok) {
        const data = await response.json()
        // 只顯示還沒有關聯帳號的作者
        const unlinkedAuthors = data.filter(author => !author.user_id)
        setAvailableAuthors(unlinkedAuthors)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    }
  }

  const handleFormSubmit = async (data) => {
    // 驗證安全問題答案
    const answer = data.securityAnswer.toLowerCase().trim()
    if (answer !== '小明' && answer !== '小民') {
      alert('安全問題答案錯誤')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        username: data.username,
        email: data.email,
        password: data.password,
        authorName: data.authorName || null
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="register-form">
      <div className="form-group">
        <label htmlFor="username">用戶名稱 *</label>
        <input
          id="username"
          type="text"
          {...register('username', {
            required: '請輸入用戶名稱',
            minLength: { value: 3, message: '用戶名稱至少需要3個字符' },
            pattern: { value: /^[a-zA-Z0-9_]+$/, message: '只能使用英文、數字和底線' }
          })}
          className={errors.username ? 'error' : ''}
          placeholder="例如：nma_chan"
        />
        {errors.username && <span className="error-message">{errors.username.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: '請輸入 Email',
            pattern: { value: /^\S+@\S+$/i, message: '請輸入有效的 Email' }
          })}
          className={errors.email ? 'error' : ''}
          placeholder="nma_chan@email.com"
        />
        {errors.email && <span className="error-message">{errors.email.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">密碼 *</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: '請輸入密碼',
            minLength: { value: 8, message: '密碼至少需要8個字符' }
          })}
          className={errors.password ? 'error' : ''}
          placeholder="至少8個字符"
        />
        {errors.password && <span className="error-message">{errors.password.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">確認密碼 *</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: '請確認密碼',
            validate: value => value === password || '密碼不一致'
          })}
          className={errors.confirmPassword ? 'error' : ''}
          placeholder="再次輸入密碼"
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="securityAnswer">
          必答題：你借器材都找誰？ *
          <span className="hint">（提示：XX）</span>
        </label>
        <input
          id="securityAnswer"
          type="text"
          {...register('securityAnswer', { required: '請回答安全問題' })}
          className={errors.securityAnswer ? 'error' : ''}
          placeholder="不要告訴我你不知道..."
        />
        {errors.securityAnswer && <span className="error-message">{errors.securityAnswer.message}</span>}
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="hasExistingWork"
            onChange={(e) => setShowAuthorSelect(e.target.checked)}
          />
          <label htmlFor="hasExistingWork">
            我有已發表的作品（關聯現有作者）
          </label>
        </div>
      </div>

      {showAuthorSelect && availableAuthors.length > 0 && (
        <div className="form-group">
          <label htmlFor="authorName">選擇您的作者名稱</label>
          <select {...register('authorName')} id="authorName" className="form-select">
            <option value="">-- 請選擇 --</option>
            {availableAuthors.map(author => (
              <option key={author.id} value={author.name}>
                {author.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? '註冊中...' : '註冊'}
      </Button>
    </form>
  )
}

export default RegisterForm