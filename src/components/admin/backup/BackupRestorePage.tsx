/**
 * 데이터 백업/복원 페이지 컴포넌트
 * 관리자가 시스템 데이터를 JSON 형식으로 내보내거나 복원할 수 있는 인터페이스를 제공합니다.
 */
import React, { useState } from 'react';
import { backupData, restoreData } from '../../../services/admin/backup';
import AdminLayout from '../AdminLayout';

/**
 * 데이터 백업/복원 페이지 컴포넌트
 */
const BackupRestorePage: React.FC = () => {
  // 백업 설정 상태
  const [backupSettings, setBackupSettings] = useState({
    includeUsers: false,
    collections: {
      posts: true,
      comments: true,
      settings: true,
      bookmarks: true,
      users: false,
    }
  });

  // 복원 설정 상태
  const [restoreSettings, setRestoreSettings] = useState({
    overwrite: false,
    deleteBeforeRestore: false,
    collections: {
      posts: true,
      comments: true,
      settings: true,
      bookmarks: true,
      users: false,
    }
  });

  // 파일 업로드 상태
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
    warnings?: string[];
  } | null>(null);

  /**
   * 백업 설정 변경 핸들러
   */
  const handleBackupSettingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, type } = event.target;
    
    if (name === 'includeUsers') {
      setBackupSettings(prev => ({
        ...prev,
        includeUsers: checked,
        // 사용자 데이터 포함 옵션이 활성화되면 사용자 컬렉션도 자동으로 활성화
        collections: checked 
          ? { ...prev.collections, users: true } 
          : prev.collections
      }));
    } else {
      // 컬렉션 체크박스 변경 처리
      const collectionName = name.replace('collection-', '');
      setBackupSettings(prev => ({
        ...prev,
        collections: {
          ...prev.collections,
          [collectionName]: checked
        }
      }));
    }
  };

  /**
   * 복원 설정 변경 핸들러
   */
  const handleRestoreSettingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    
    if (name === 'overwrite' || name === 'deleteBeforeRestore') {
      setRestoreSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // 컬렉션 체크박스 변경 처리
      const collectionName = name.replace('restore-collection-', '');
      setRestoreSettings(prev => ({
        ...prev,
        collections: {
          ...prev.collections,
          [collectionName]: checked
        }
      }));
    }
  };

  /**
   * 파일 업로드 핸들러
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploadedFile(event.target.files[0]);
      // 결과 초기화
      setResult(null);
    }
  };

  /**
   * 백업 실행 핸들러
   */
  const handleBackup = async () => {
    try {
      setIsProcessing(true);
      setResult(null);

      // 선택된 컬렉션만 필터링
      const selectedCollections = Object.entries(backupSettings.collections)
        .filter(([, selected]) => selected)
        .map(([collection]) => collection);

      if (selectedCollections.length === 0) {
        setResult({
          success: false,
          message: '백업할 컬렉션을 하나 이상 선택해주세요.'
        });
        return;
      }

      // 백업 실행
      const backupJSON = await backupData({
        collections: selectedCollections,
        includeUsers: backupSettings.includeUsers
      });

      // 백업 파일 다운로드
      const blob = new Blob([backupJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // 현재 날짜를 파일명에 포함
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `mac-board-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 성공 메시지 표시
      setResult({
        success: true,
        message: '백업이 성공적으로 완료되었습니다. 파일이 다운로드됩니다.'
      });

    } catch (error) {
      console.error('백업 오류:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '백업 중 오류가 발생했습니다.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 복원 실행 핸들러
   */
  const handleRestore = async () => {
    if (!uploadedFile) {
      setResult({
        success: false,
        message: '복원할 백업 파일을 선택해주세요.'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setResult(null);

      // 선택된 컬렉션만 필터링
      const selectedCollections = Object.entries(restoreSettings.collections)
        .filter(([, selected]) => selected)
        .map(([collection]) => collection);

      if (selectedCollections.length === 0) {
        setResult({
          success: false,
          message: '복원할 컬렉션을 하나 이상 선택해주세요.'
        });
        return;
      }

      // 파일 읽기
      const fileContent = await readFileAsText(uploadedFile);

      // 복원 실행
      const restoreResult = await restoreData(fileContent, {
        collections: selectedCollections,
        overwrite: restoreSettings.overwrite,
        deleteBeforeRestore: restoreSettings.deleteBeforeRestore
      });

      // 결과 표시
      setResult({
        success: restoreResult.success,
        message: restoreResult.message,
        details: {
          restoredCounts: restoreResult.restoredCounts
        },
        warnings: restoreResult.warnings
      });

    } catch (error) {
      console.error('복원 오류:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 파일 내용을 텍스트로 읽는 함수
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('파일을 텍스트로 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
      };
      reader.readAsText(file);
    });
  };

  return (
    <AdminLayout title="데이터 백업/복원">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 백업 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">데이터 백업</h2>
          <p className="text-gray-600 mb-4">
            시스템 데이터를 JSON 형식으로 내보냅니다. 이 파일은 나중에 데이터 복원에 사용할 수 있습니다.
          </p>

          <div className="space-y-4 mb-6">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">백업할 컬렉션 선택</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="collection-posts"
                    name="collection-posts"
                    checked={backupSettings.collections.posts}
                    onChange={handleBackupSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="collection-posts" className="ml-2 text-gray-700">
                    게시물 (posts)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="collection-comments"
                    name="collection-comments"
                    checked={backupSettings.collections.comments}
                    onChange={handleBackupSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="collection-comments" className="ml-2 text-gray-700">
                    댓글 (comments)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="collection-settings"
                    name="collection-settings"
                    checked={backupSettings.collections.settings}
                    onChange={handleBackupSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="collection-settings" className="ml-2 text-gray-700">
                    설정 (settings)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="collection-bookmarks"
                    name="collection-bookmarks"
                    checked={backupSettings.collections.bookmarks}
                    onChange={handleBackupSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="collection-bookmarks" className="ml-2 text-gray-700">
                    북마크 (bookmarks)
                  </label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeUsers"
                  name="includeUsers"
                  checked={backupSettings.includeUsers}
                  onChange={handleBackupSettingChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeUsers" className="ml-2 text-gray-700">
                  사용자 데이터 포함 (민감한 개인정보 포함)
                </label>
              </div>
              {backupSettings.includeUsers && (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ 주의: 사용자 데이터에는 개인정보가 포함될 수 있습니다. 법적 규제에 따라 적절히 관리하세요.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleBackup}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center w-full transition-colors"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                데이터 백업 다운로드
              </>
            )}
          </button>
        </div>

        {/* 복원 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">데이터 복원</h2>
          <p className="text-gray-600 mb-4">
            이전에 백업한 JSON 파일을 업로드하여 시스템 데이터를 복원합니다.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="restore-file" className="block text-sm font-medium text-gray-700 mb-1">
                백업 파일 선택
              </label>
              <input
                type="file"
                id="restore-file"
                name="restore-file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">복원할 컬렉션 선택</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restore-collection-posts"
                    name="restore-collection-posts"
                    checked={restoreSettings.collections.posts}
                    onChange={handleRestoreSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="restore-collection-posts" className="ml-2 text-gray-700">
                    게시물 (posts)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restore-collection-comments"
                    name="restore-collection-comments"
                    checked={restoreSettings.collections.comments}
                    onChange={handleRestoreSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="restore-collection-comments" className="ml-2 text-gray-700">
                    댓글 (comments)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restore-collection-settings"
                    name="restore-collection-settings"
                    checked={restoreSettings.collections.settings}
                    onChange={handleRestoreSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="restore-collection-settings" className="ml-2 text-gray-700">
                    설정 (settings)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restore-collection-bookmarks"
                    name="restore-collection-bookmarks"
                    checked={restoreSettings.collections.bookmarks}
                    onChange={handleRestoreSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="restore-collection-bookmarks" className="ml-2 text-gray-700">
                    북마크 (bookmarks)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restore-collection-users"
                    name="restore-collection-users"
                    checked={restoreSettings.collections.users}
                    onChange={handleRestoreSettingChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="restore-collection-users" className="ml-2 text-gray-700">
                    사용자 (users)
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="overwrite"
                  name="overwrite"
                  checked={restoreSettings.overwrite}
                  onChange={handleRestoreSettingChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="overwrite" className="ml-2 text-gray-700">
                  기존 문서 덮어쓰기
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="deleteBeforeRestore"
                  name="deleteBeforeRestore"
                  checked={restoreSettings.deleteBeforeRestore}
                  onChange={handleRestoreSettingChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="deleteBeforeRestore" className="ml-2 text-gray-700">
                  복원 전 기존 데이터 삭제
                </label>
              </div>
              {restoreSettings.deleteBeforeRestore && (
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ 경고: 이 옵션은 복원 전 선택한 컬렉션의 모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다!
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleRestore}
            disabled={isProcessing || !uploadedFile}
            className={`${
              isProcessing || !uploadedFile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white py-2 px-4 rounded-md flex items-center justify-center w-full transition-colors`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                데이터 복원하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div className={`mt-8 p-4 rounded-md ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '성공!' : '오류!'}
              </h3>
              <div className={`mt-2 text-sm ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                <p>{result.message}</p>
                
                {/* 복원 상세 정보 */}
                {result.success && result.details?.restoredCounts && (
                  <div className="mt-2">
                    <p className="font-medium">복원된 문서 수:</p>
                    <ul className="list-disc list-inside pl-2 mt-1">
                      {Object.entries(result.details.restoredCounts).map(([collection, count]) => (
                        <li key={collection}>{collection}: {count}개</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 경고 메시지 목록 */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="font-medium text-yellow-800">경고 메시지:</p>
                    <ul className="list-disc list-inside pl-2 mt-1 text-yellow-700">
                      {result.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                      {result.warnings.length > 5 && (
                        <li>... 외 {result.warnings.length - 5}개 경고 (자세한 내용은 콘솔 로그를 확인하세요)</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BackupRestorePage; 