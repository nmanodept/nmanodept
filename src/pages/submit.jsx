import React from 'react';
import Layout from '../components/common/Layout';
import Seo from '../components/common/Seo';
import SubmitForm from '../components/forms/SubmitForm';

const SubmitPage = () => {
  return (
    <Layout>
      <Seo title="投稿作品" />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* 頁面標題 */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">投稿作品</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              歡迎分享你的創作！請填寫以下表單，我們會在審核後將你的作品展示在網站上。
            </p>
          </div>

          {/* 表單區域 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <SubmitForm />
          </div>

          {/* 注意事項 */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">投稿須知</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>作品預覽圖建議使用 16:9 比例，檔案大小請勿超過 5MB</li>
                <li>請確保上傳的內容為你的原創作品或已獲得授權</li>
                <li>投稿作品將在審核通過後公開展示</li>
                <li>如有任何問題，歡迎聯繫管理員</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitPage;