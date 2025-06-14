//Location: /src/components/forms/DisclaimerCheckbox/index.jsx
import React from 'react'
import './DisclaimerCheckbox.css'

const DisclaimerCheckbox = React.forwardRef(({ error, ...props }, ref) => {
  return (
    <div className="disclaimer-checkbox">
      <label className="checkbox-container">
        <input
          type="checkbox"
          ref={ref}
          {...props}
        />
        <span className="checkmark"></span>
        <span className="disclaimer-text">
          我已閱讀並同意投稿免責聲明。我了解本平台僅提供作品紀錄性質用，
          不屬於公開發表，且平台不負責作品的保管與備份。
          我確保作品為原創或已獲得合法授權。
        </span>
      </label>
      {error && (
        <span className="error-message">請同意免責聲明才能投稿</span>
      )}
    </div>
  )
})

DisclaimerCheckbox.displayName = 'DisclaimerCheckbox'

export default DisclaimerCheckbox